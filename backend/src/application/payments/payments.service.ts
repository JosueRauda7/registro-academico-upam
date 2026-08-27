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

  async createTuitionPayment(studentId: string, cycleId: string) {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const cycle = await this.cycleRepository.findById(cycleId);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    // Check if already paid
    const existingPayment = await this.paymentRepository.findTuitionPayment(studentId, cycleId);
    if (existingPayment) {
      throw new BadRequestException('La matrícula de este ciclo ya ha sido pagada');
    }

    const reference = this.wompiGateway.generateReference();

    const payment = await this.paymentRepository.create({
      studentId,
      cycleId,
      amount: cycle.tuitionAmount,
      status: PaymentStatus.PENDING,
      type: PaymentType.TUITION,
      description: `Matrícula ${cycle.name}`,
      reference,
    });

    // Create Wompi payment
    try {
      const wompiResponse = await this.wompiGateway.createPayment({
        amountInCents: Math.round(cycle.tuitionAmount * 100),
        currency: 'USD',
        reference,
        customerEmail: student.user.email,
      });

      this.logger.log(`Wompi payment created: ${wompiResponse.data.id}`);

      return {
        payment,
        wompiOrderId: wompiResponse.data.id,
        message: 'Pago de matrícula creado. Procese el pago con Wompi.',
      };
    } catch (error) {
      this.logger.error(`Wompi error: ${error.message}`);
      throw new BadRequestException('Error al crear el pago con Wompi');
    }
  }

  async createMonthlyPayment(studentId: string, cycleId: string, month: number) {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const cycle = await this.cycleRepository.findById(cycleId);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    if (month < 1 || month > cycle.monthlyCount) {
      throw new BadRequestException(`El mes debe estar entre 1 y ${cycle.monthlyCount}`);
    }

    // Check if already paid this month
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

    const payment = await this.paymentRepository.create({
      studentId,
      cycleId,
      amount: cycle.monthlyAmount,
      status: PaymentStatus.PENDING,
      type: PaymentType.MONTHLY,
      month,
      description: `${cycle.name} - Mensualidad ${month}`,
      reference,
    });

    try {
      const wompiResponse = await this.wompiGateway.createPayment({
        amountInCents: Math.round(cycle.monthlyAmount * 100),
        currency: 'USD',
        reference,
        customerEmail: student.user.email,
      });

      return {
        payment,
        wompiOrderId: wompiResponse.data.id,
        message: `Pago mensualidad ${month} creado. Procese el pago con Wompi.`,
      };
    } catch (error) {
      this.logger.error(`Wompi error: ${error.message}`);
      throw new BadRequestException('Error al crear el pago con Wompi');
    }
  }

  async handleWompiWebhook(payload: any) {
    const { event, transaction } = payload;

    this.logger.log(`Wompi webhook received: ${event} - ${transaction?.id}`);

    if (event === 'transaction.updated' || event === 'payment.approved') {
      const payment = await this.paymentRepository.findByReference(transaction.reference);
      if (!payment) {
        this.logger.warn(`Payment not found for reference: ${transaction.reference}`);
        return;
      }

      const status = await this.wompiGateway.getTransactionStatus(transaction.id);

      await this.paymentRepository.update(payment.id, {
        status,
        wompiTransactionId: transaction.id,
        paymentDate: status === PaymentStatus.COMPLETED ? new Date() : null,
      });

      if (status === PaymentStatus.COMPLETED) {
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

      this.logger.log(`Payment ${payment.id} updated to ${status}`);
    }

    return { received: true };
  }

  async getMyPayments(studentId: string) {
    return this.paymentRepository.findByStudent(studentId);
  }

  async getMyPaymentsByCycle(studentId: string, cycleId: string) {
    return this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
  }

  async getMonthlyPayments(studentId: string, cycleId: string) {
    const payments = await this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
    return payments.filter((p) => p.type === PaymentType.MONTHLY);
  }

  async getPaymentById(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }
    return payment;
  }

  async getAllPayments(cycleId?: string) {
    if (cycleId) {
      const payments = await this.paymentRepository.findByStudentAndCycle('', cycleId);
      return payments;
    }
    // Return recent payments
    return [];
  }

  async getPaymentStats(cycleId: string) {
    const total = await this.paymentRepository.sumCompletedByCycle(cycleId);
    return { totalCollected: total };
  }

  async getMyPaymentSummary(studentId: string, cycleId: string) {
    const payments = await this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
    const cycle = await this.cycleRepository.findById(cycleId);

    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    const tuitionPaid = payments.some(
      (p) => p.type === PaymentType.TUITION && p.status === PaymentStatus.COMPLETED,
    );

    const monthlyPayments = payments.filter((p) => p.type === PaymentType.MONTHLY);
    const completedMonthly = monthlyPayments.filter((p) => p.status === PaymentStatus.COMPLETED);

    return {
      cycle: cycle.name,
      tuitionAmount: cycle.tuitionAmount,
      tuitionPaid,
      monthlyAmount: cycle.monthlyAmount,
      monthlyCount: cycle.monthlyCount,
      monthlyPayments: Array.from({ length: cycle.monthlyCount }, (_, i) => {
        const month = i + 1;
        const payment = completedMonthly.find((p) => p.month === month);
        return {
          month,
          amount: cycle.monthlyAmount,
          paid: !!payment,
          paymentDate: payment?.paymentDate || null,
          reference: payment?.reference || null,
        };
      }),
      totalPaid: completedMonthly.reduce((sum, p) => sum + Number(p.amount), 0) + (tuitionPaid ? Number(cycle.tuitionAmount) : 0),
      totalPending:
        (!tuitionPaid ? Number(cycle.tuitionAmount) : 0) +
        (cycle.monthlyCount - completedMonthly.length) * Number(cycle.monthlyAmount),
    };
  }
}
