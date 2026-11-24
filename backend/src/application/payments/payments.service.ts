import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PaymentRepository } from '../../infrastructure/database/repositories/payment.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { WompiGateway } from '../../infrastructure/payment/wompi.gateway';
import { EmailService } from '../../infrastructure/email/email.service';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentType } from '../../domain/enums/payment-type.enum';
import { UserRole } from '../../domain/enums/role.enum';
import { paymentResponse } from './payment-response';
import { resolveStudentFees } from './student-fees';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly studentRepository: StudentRepository,
    private readonly cycleRepository: CycleRepository,
    private readonly wompiGateway: WompiGateway,
    private readonly emailService: EmailService,
  ) {}

  private async resolveStudentId(userId: string): Promise<string> {
    const student = await this.studentRepository.findByUserId(userId);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return student.id;
  }

  async createTuitionPayment(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    const student = await this.studentRepository.findById(studentId);

    const cycle = await this.cycleRepository.findById(cycleId);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    const existingPayment = await this.paymentRepository.findTuitionPayment(studentId, cycleId);
    if (existingPayment) {
      throw new BadRequestException('La matrícula de este ciclo ya ha sido pagada');
    }

    const { tuitionAmount } = resolveStudentFees(student!, cycle);
    const reference = this.wompiGateway.generateReference();

    const payment = await this.paymentRepository.create({
      studentId,
      cycleId,
      amount: tuitionAmount,
      status: PaymentStatus.PENDING,
      type: PaymentType.TUITION,
      description: `Matrícula ${cycle.name}`,
      reference,
    });

    try {
      const wompiResponse = await this.wompiGateway.createPayment({
        amountInCents: Math.round(tuitionAmount * 100),
        currency: 'USD',
        reference,
        customerEmail: student!.user.email,
      });

      this.logger.log(`Wompi payment created: ${wompiResponse.data.id}`);
      await this.paymentRepository.update(payment.id, { wompiTransactionId: wompiResponse.data.id });

      return {
        payment: paymentResponse({ ...payment, wompiTransactionId: wompiResponse.data.id }),
        wompiOrderId: wompiResponse.data.id,
        message: 'Pago de matrícula creado. Procese el pago con Wompi.',
      };
    } catch (error) {
      this.logger.error(`Wompi error: ${error.message}`);
      throw new BadRequestException('Error al crear el pago con Wompi');
    }
  }

  async createMonthlyPayment(userId: string, cycleId: string, month: number) {
    const studentId = await this.resolveStudentId(userId);

    const cycle = await this.cycleRepository.findById(cycleId);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    if (month < 1 || month > cycle.monthlyCount) {
      throw new BadRequestException(`El mes debe estar entre 1 y ${cycle.monthlyCount}`);
    }

    const existingPayments = await this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
    const alreadyPaid = existingPayments.some(
      (p) =>
        p.type === PaymentType.MONTHLY &&
        p.month === month &&
        p.status === PaymentStatus.COMPLETED,
    );

    if (alreadyPaid) {
      throw new BadRequestException(`El pago del mes ${month} ya fue realizado`);
    }

    const reference = this.wompiGateway.generateReference();
    const student = await this.studentRepository.findById(studentId);
    const { monthlyAmount } = resolveStudentFees(student!, cycle);

    const payment = await this.paymentRepository.create({
      studentId,
      cycleId,
      amount: monthlyAmount,
      status: PaymentStatus.PENDING,
      type: PaymentType.MONTHLY,
      month,
      description: `${cycle.name} - Mensualidad ${month}`,
      reference,
    });

    try {
      const wompiResponse = await this.wompiGateway.createPayment({
        amountInCents: Math.round(monthlyAmount * 100),
        currency: 'USD',
        reference,
        customerEmail: student!.user.email,
      });

      await this.paymentRepository.update(payment.id, { wompiTransactionId: wompiResponse.data.id });

      return {
        payment: paymentResponse({ ...payment, wompiTransactionId: wompiResponse.data.id }),
        wompiOrderId: wompiResponse.data.id,
        message: `Pago mensualidad ${month} creado. Procese el pago con Wompi.`,
      };
    } catch (error) {
      this.logger.error(`Wompi error: ${error.message}`);
      throw new BadRequestException('Error al crear el pago con Wompi');
    }
  }

  async handleWompiWebhook(payload: any) {
    const event = this.wompiGateway.verifyEvent(payload);
    const transaction = await this.wompiGateway.getTransaction(event.id);
    const payment = await this.paymentRepository.findByReference(transaction.reference);
    if (!payment || transaction.id !== event.id || payment.paymentMethod !== 'wompi' ||
        payment.wompiTransactionId !== transaction.id || transaction.currency !== 'USD' ||
        !Number.isSafeInteger(transaction.amount_in_cents) ||
        transaction.amount_in_cents !== Math.round(Number(payment.amount) * 100)) {
      throw new BadRequestException('La transacción no corresponde al pago');
    }
    const statuses: Record<string, PaymentStatus> = {
      APPROVED: PaymentStatus.COMPLETED, DECLINED: PaymentStatus.FAILED,
      ERROR: PaymentStatus.FAILED, PENDING: PaymentStatus.PENDING, VOIDED: PaymentStatus.REFUNDED,
    };
    const status = statuses[transaction.status];
    if (!status) throw new BadRequestException('Estado de transacción inválido');
    const changed = await this.paymentRepository.applyVerifiedTransaction(payment.id, transaction.id, status);
    if (changed && status === PaymentStatus.COMPLETED) {
        const student = await this.studentRepository.findById(payment.studentId);
        if (student) {
          await this.emailService.sendPaymentConfirmation(student.user.email, {
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            amount: payment.amount,
            cycleName: payment.cycle?.name || '',
            type: payment.type,
            reference: payment.reference,
          });
        }
      }

    return { received: true };
  }

  async createManualPayment(
    collectorId: string,
    data: {
      studentId: string;
      cycleId: string;
      amount: number;
      type: 'tuition' | 'monthly';
      month?: number;
      description?: string;
      paymentMethod?: 'cash' | 'bank';
      bankName?: string;
      bankTransactionCode?: string;
      receiptImageUrl?: string;
    },
  ) {
    const student = await this.studentRepository.findById(data.studentId);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const cycle = await this.cycleRepository.findById(data.cycleId);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    if (data.type === 'tuition') {
      const existing = await this.paymentRepository.findTuitionPayment(data.studentId, data.cycleId);
      if (existing) {
        throw new BadRequestException('La matrícula de este ciclo ya ha sido pagada');
      }
    }

    if (data.type === 'monthly') {
      if (!data.month || data.month < 1 || data.month > cycle.monthlyCount) {
        throw new BadRequestException(`El mes debe estar entre 1 y ${cycle.monthlyCount}`);
      }
      const existingPayments = await this.paymentRepository.findByStudentAndCycle(data.studentId, data.cycleId);
      const alreadyPaid = existingPayments.some(
        (p) => p.type === PaymentType.MONTHLY && p.month === data.month && p.status === PaymentStatus.COMPLETED,
      );
      if (alreadyPaid) {
        throw new BadRequestException(`El pago del mes ${data.month} ya fue realizado`);
      }
    }

    const fees = resolveStudentFees(student, cycle);
    const expectedAmount = data.type === 'monthly' ? fees.monthlyAmount : fees.tuitionAmount;

    if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) ||
        Math.abs(data.amount * 100 - Math.round(data.amount * 100)) > 0.000001 ||
        Math.round(data.amount * 100) !== Math.round(expectedAmount * 100)) {
      throw new BadRequestException(
        `El monto del pago debe ser exactamente ${expectedAmount.toFixed(2)} USD para ${
          data.type === 'monthly' ? 'la mensualidad' : 'la matrícula'
        } de este estudiante y ciclo`,
      );
    }

    const paymentMethod = data.paymentMethod || 'cash';
    if (paymentMethod !== 'cash' && paymentMethod !== 'bank') {
      throw new BadRequestException('El método de pago debe ser cash o bank');
    }

    if (paymentMethod === 'bank') {
      if (!data.bankName || !data.bankName.trim()) {
        throw new BadRequestException('Debe indicar el banco para pagos por transacción bancaria');
      }
      if (!data.bankTransactionCode || !data.bankTransactionCode.trim()) {
        throw new BadRequestException('Debe indicar el código de la transacción bancaria');
      }
      if (data.receiptImageUrl && !/^\/api\/uploads\/receipts\/[a-f0-9-]+\.webp$/i.test(data.receiptImageUrl)) {
        throw new BadRequestException('El comprobante debe ser una imagen válida del sistema');
      }
    }

    const reference = this.wompiGateway.generateReference();

    const payment = await this.paymentRepository.create({
      studentId: data.studentId,
      cycleId: data.cycleId,
      amount: expectedAmount,
      status: PaymentStatus.COMPLETED,
      type: data.type === 'monthly' ? PaymentType.MONTHLY : PaymentType.TUITION,
      month: data.month || null,
      description: data.description || `Pago manual - ${data.type === 'tuition' ? 'Matrícula' : `Mensualidad ${data.month}`}`,
      reference,
      paymentDate: new Date(),
      paymentMethod,
      bankName: paymentMethod === 'bank' ? data.bankName! : null,
      bankTransactionCode: paymentMethod === 'bank' ? data.bankTransactionCode! : null,
      receiptImageUrl: data.receiptImageUrl || null,
    });

    this.logger.log(`Manual payment created: ${payment.id} by collector ${collectorId}`);

    await this.emailService.sendPaymentConfirmation(student.user.email, {
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      amount: expectedAmount,
      cycleName: cycle.name,
      type: data.type === 'tuition' ? 'tuition' : 'monthly',
      reference,
    });

    return {
      payment: paymentResponse(payment),
      message: 'Pago manual registrado exitosamente',
    };
  }

  async getMyPayments(userId: string) {
    const studentId = await this.resolveStudentId(userId);
    return (await this.paymentRepository.findByStudent(studentId)).map(paymentResponse);
  }

  async getMyPaymentsByCycle(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    return (await this.paymentRepository.findByStudentAndCycle(studentId, cycleId)).map(paymentResponse);
  }

  async getMonthlyPayments(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    const payments = await this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
    return payments.filter((p) => p.type === PaymentType.MONTHLY).map(paymentResponse);
  }

  async getPaymentById(id: string, actor: { sub: string; role: UserRole }) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }
    const staff = [UserRole.ADMINISTRATOR, UserRole.COLLECTOR].includes(actor.role);
    if (!staff && (actor.role !== UserRole.STUDENT || payment.student?.userId !== actor.sub)) {
      throw new NotFoundException('Pago no encontrado');
    }
    return paymentResponse(payment);
  }

  async getAllPayments(cycleId?: string) {
    if (cycleId) {
      return (await this.paymentRepository.findByCycle(cycleId)).map(paymentResponse);
    }
    return (await this.paymentRepository.findAll()).map(paymentResponse);
  }

  async getPaymentStats(cycleId: string) {
    const total = await this.paymentRepository.sumCompletedByCycle(cycleId);
    return { totalCollected: total };
  }

  async getMyPaymentSummary(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    const payments = await this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
    const cycle = await this.cycleRepository.findById(cycleId);

    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    const student = await this.studentRepository.findById(studentId);
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    const fees = resolveStudentFees(student, cycle);
    const completed = payments.filter(p => p.status === PaymentStatus.COMPLETED);
    const tuitionPayment = completed.find(p => p.type === PaymentType.TUITION);
    const tuitionPaid = !!tuitionPayment;
    const completedMonthly = completed.filter(p => p.type === PaymentType.MONTHLY);
    const paidMonths = new Set(completedMonthly.map(p => p.month).filter(month => month && month >= 1 && month <= cycle.monthlyCount));

    return {
      cycle: cycle.name,
      tuitionAmount: Number(tuitionPayment?.amount ?? fees.tuitionAmount),
      tuitionPaid,
      monthlyAmount: fees.monthlyAmount,
      monthlyCount: cycle.monthlyCount,
      monthlyPayments: Array.from({ length: cycle.monthlyCount }, (_, i) => {
        const month = i + 1;
        const payment = completedMonthly.find((p) => p.month === month);
        return {
          month,
          amount: Number(payment?.amount ?? fees.monthlyAmount),
          paid: !!payment,
          paymentDate: payment?.paymentDate || null,
          reference: payment?.reference || null,
        };
      }),
      totalPaid: Number(completed.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)),
      totalPending: Number(((!tuitionPaid ? fees.tuitionAmount : 0) +
        (cycle.monthlyCount - paidMonths.size) * fees.monthlyAmount).toFixed(2)),
    };
  }
}
