import { Injectable, Logger } from '@nestjs/common';
import { PaymentRepository } from '../../infrastructure/database/repositories/payment.repository';
import { EnrollmentRepository } from '../../infrastructure/database/repositories/enrollment.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { PaymentType } from '../../domain/enums/payment-type.enum';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pagos');

    sheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Referencia', key: 'reference', width: 20 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Mes', key: 'month', width: 10 },
      { header: 'Monto', key: 'amount', width: 12 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Descripcion', key: 'description', width: 30 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    payments.forEach((p) => {
      sheet.addRow({
        date: p.createdAt?.toLocaleDateString() || '',
        reference: p.reference,
        type: p.type === PaymentType.TUITION ? 'Matricula' : 'Mensualidad',
        month: p.month || '-',
        amount: `$${Number(p.amount).toFixed(2)}`,
        status: this.translateStatus(p.status),
        description: p.description,
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async generateEnrollmentReport(cycleId: string) {
    const enrollments = await this.enrollmentRepository.findByCycle(cycleId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inscripciones');

    sheet.columns = [
      { header: 'Carnet', key: 'carnet', width: 15 },
      { header: 'Estudiante', key: 'student', width: 30 },
      { header: 'Carrera', key: 'career', width: 25 },
      { header: 'Materias', key: 'subjects', width: 40 },
      { header: 'Total Creditos', key: 'credits', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fecha Inscripcion', key: 'date', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      sheet.addRow({
        carnet: student?.carnet || '',
        student: student ? `${student.user.firstName} ${student.user.lastName}` : '',
        career: student?.career || '',
        subjects: enrollment.subjects?.map((es) => es.subject?.name).filter(Boolean).join(', ') || '',
        credits: enrollment.subjects?.reduce((sum, es) => sum + (es.subject?.credits || 0), 0) || 0,
        status: enrollment.status,
        date: enrollment.enrolledAt?.toLocaleDateString() || '',
      });
    }

    return workbook.xlsx.writeBuffer();
  }

  async generateCollectionReport(cycleId: string) {
    const payments = await this.paymentRepository.findByCycle(cycleId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Recaudacion');

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
      const amount = Number(p.amount);
      if (p.status === 'completed') totalCollected += amount;
      else totalPending += amount;

      sheet.addRow({
        date: p.createdAt?.toLocaleDateString() || '',
        reference: p.reference,
        student: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : '',
        type: p.type === PaymentType.TUITION ? 'Matricula' : `Mensualidad ${p.month || ''}`,
        amount: `$${amount.toFixed(2)}`,
        status: this.translateStatus(p.status),
      });
    }

    sheet.addRow([]);
    sheet.addRow(['Total Recaudado', `$${totalCollected.toFixed(2)}`]);
    sheet.addRow(['Total Pendiente', `$${totalPending.toFixed(2)}`]);

    return workbook.xlsx.writeBuffer();
  }

  async generateStudentListReport(cycleId: string) {
    const enrollments = await this.enrollmentRepository.findByCycle(cycleId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lista de Estudiantes');

    sheet.columns = [
      { header: 'Carnet', key: 'carnet', width: 15 },
      { header: 'Codigo', key: 'code', width: 18 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Carrera', key: 'career', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Telefono', key: 'phone', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    for (const enrollment of enrollments) {
      const student = enrollment.student;
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

    const PDFDoc = PDFDocument as any;
    const doc = new PDFDoc({ size: 'letter', margin: 50 });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text('UNIVERSIDAD PANAMERICANA DE EL SALVADOR', { align: 'center' });
    doc.fontSize(14).text('Comprobante de Pago', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Referencia: ${payment.reference}`);
    doc.text(`Fecha: ${payment.createdAt?.toLocaleDateString() || ''}`);
    doc.text(`Tipo: ${payment.type === PaymentType.TUITION ? 'Matricula' : `Mensualidad ${payment.month}`}`);
    doc.text(`Descripcion: ${payment.description}`);
    doc.moveDown();
    doc.fontSize(14).text(`Monto: $${Number(payment.amount).toFixed(2)}`);
    doc.moveDown();
    doc.fontSize(11).text(`Estado: ${this.translateStatus(payment.status)}`);
    doc.text(`Metodo de pago: ${payment.paymentMethod}`);

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));
      doc.end();
    });
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
