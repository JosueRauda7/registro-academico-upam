import { Injectable, Logger } from '@nestjs/common';
import { PaymentRepository } from '../../infrastructure/database/repositories/payment.repository';
import { EnrollmentRepository } from '../../infrastructure/database/repositories/enrollment.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { PaymentType } from '../../domain/enums/payment-type.enum';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly studentRepository: StudentRepository,
    private readonly cycleRepository: CycleRepository,
  ) {}

  async generateStudentPaymentsReport(studentId: string, cycleId?: string) {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    let payments;
    if (cycleId) {
      payments = await this.paymentRepository.findByStudentAndCycle(studentId, cycleId);
    } else {
      payments = await this.paymentRepository.findByStudent(studentId);
    }

    const workbook = new (await import('exceljs')).default.Workbook();
    const sheet = workbook.addWorksheet('Pagos');

    sheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Referencia', key: 'reference', width: 20 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Mes', key: 'month', width: 10 },
      { header: 'Monto', key: 'amount', width: 12 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Descripción', key: 'description', width: 30 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };

    payments.forEach((p) => {
      sheet.addRow({
        date: p.createdAt?.toLocaleDateString() || '',
        reference: p.reference,
        type: p.type === PaymentType.TUITION ? 'Matrícula' : 'Mensualidad',
        month: p.month || '-',
        amount: `$${Number(p.amount).toFixed(2)}`,
        status: this.translateStatus(p.status),
        description: p.description,
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async generateEnrollmentReport(cycleId: string) {
    const enrollments = await this.enrollmentRepository.findByStudent('');
    const cycleEnrollments = enrollments.filter((e) => e.cycleId === cycleId);

    const workbook = new (await import('exceljs')).default.Workbook();
    const sheet = workbook.addWorksheet('Inscripciones');

    sheet.columns = [
      { header: 'Carnet', key: 'carnet', width: 15 },
      { header: 'Estudiante', key: 'student', width: 30 },
      { header: 'Carrera', key: 'career', width: 25 },
      { header: 'Materias', key: 'subjects', width: 40 },
      { header: 'Total Créditos', key: 'credits', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fecha Inscripción', key: 'date', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    for (const enrollment of cycleEnrollments) {
      const student = await this.studentRepository.findById(enrollment.studentId);
      sheet.addRow({
        carnet: student?.carnet || '',
        student: student ? `${student.user.firstName} ${student.user.lastName}` : '',
        career: student?.career || '',
        subjects: enrollment.subjects?.map((es) => es.subject?.name).join(', ') || '',
        credits: enrollment.subjects?.reduce((sum, es) => sum + (es.subject?.credits || 0), 0) || 0,
        status: enrollment.status,
        date: enrollment.enrolledAt?.toLocaleDateString() || '',
      });
    }

    return workbook.xlsx.writeBuffer();
  }

  async generateCollectionReport(cycleId: string) {
    const payments = await this.paymentRepository.findByStudentAndCycle('', cycleId);

    const workbook = new (await import('exceljs')).default.Workbook();
    const sheet = workbook.addWorksheet('Recaudación');

    sheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Referencia', key: 'reference', width: 20 },
      { header: 'Estudiante', key: 'student', width: 30 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Monto', key: 'amount', width: 12 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    let totalCollected = 0;
    let totalPending = 0;

    for (const p of payments) {
      const student = await this.studentRepository.findById(p.studentId);
      const amount = Number(p.amount);
      if (p.status === 'completed') totalCollected += amount;
      else totalPending += amount;

      sheet.addRow({
        date: p.createdAt?.toLocaleDateString() || '',
        reference: p.reference,
        student: student ? `${student.user.firstName} ${student.user.lastName}` : '',
        type: p.type === PaymentType.TUITION ? 'Matrícula' : `Mensualidad ${p.month || ''}`,
        amount: `$${amount.toFixed(2)}`,
        status: this.translateStatus(p.status),
      });
    }

    const summaryRow = sheet.addRow([]);
    sheet.addRow(['Total Recaudado', `$${totalCollected.toFixed(2)}`]);
    sheet.addRow(['Total Pendiente', `$${totalPending.toFixed(2)}`]);

    return workbook.xlsx.writeBuffer();
  }

  async generateStudentListReport(cycleId: string) {
    const enrollments = await this.enrollmentRepository.findByStudent('');
    const cycleEnrollments = enrollments.filter((e) => e.cycleId === cycleId);

    const workbook = new (await import('exceljs')).default.Workbook();
    const sheet = workbook.addWorksheet('Lista de Estudiantes');

    sheet.columns = [
      { header: 'Carnet', key: 'carnet', width: 15 },
      { header: 'Código', key: 'code', width: 18 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Carrera', key: 'career', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    for (const enrollment of cycleEnrollments) {
      const student = await this.studentRepository.findById(enrollment.studentId);
      if (student) {
        sheet.addRow({
          carnet: student.carnet,
          code: student.studentCode,
          name: `${student.user.firstName} ${student.user.lastName}`,
          career: student.career,
          email: student.user.email,
          phone: student.phone || '',
        });
      }
    }

    return workbook.xlsx.writeBuffer();
  }

  async generatePdfPaymentReceipt(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    const PDFDocument = (await import('pdfkit')).default;
    const stream = new PDFDocument({ size: 'letter', margin: 50 });

    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const buffer = await new Promise<Buffer>((resolve) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

    stream.fontSize(20).text('UNIVERSIDAD PANAMERICANA DE EL SALVADOR', { align: 'center' });
    stream.fontSize(14).text('Comprobante de Pago', { align: 'center' });
    stream.moveDown();

    stream.fontSize(11);
    stream.text(`Referencia: ${payment.reference}`);
    stream.text(`Fecha: ${payment.createdAt?.toLocaleDateString() || ''}`);
    stream.text(`Tipo: ${payment.type === PaymentType.TUITION ? 'Matrícula' : `Mensualidad ${payment.month}`}`);
    stream.text(`Descripción: ${payment.description}`);
    stream.moveDown();
    stream.fontSize(14).text(`Monto: $${Number(payment.amount).toFixed(2)}`);
    stream.moveDown();
    stream.fontSize(11).text(`Estado: ${this.translateStatus(payment.status)}`);
    stream.text(`Método de pago: ${payment.paymentMethod}`);

    stream.end();

    return buffer;
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado',
    };
    return translations[status] || status;
  }
}
