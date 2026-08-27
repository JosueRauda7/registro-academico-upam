import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IEmailService,
  PaymentEmailData,
  EnrollmentEmailData,
} from '../../domain/interfaces/email-service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.configService.get<string>('RESEND_FROM_EMAIL', 'UPAM <no-reply@upam.edu.sv>');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set. Emails will not be sent.');
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`Sending password reset email to ${to}`);

    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email.');
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Recuperacion de contrasena - UPAM',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background-color:#1B4F72;border-radius:8px 8px 0 0;padding:24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">UPAM</h1>
                <p style="color:#93c5fd;margin:4px 0 0;font-size:12px;">Universidad Panamericana de El Salvador</p>
              </div>
              <div style="background-color:white;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
                <h2 style="color:#1f2937;margin-top:0;">Recuperacion de contrasena</h2>
                <p style="color:#4b5563;">Hemos recibido una solicitud para restablecer tu contrasena.</p>
                <p style="color:#4b5563;">Haz clic en el siguiente boton para continuar:</p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${resetUrl}" style="background-color:#1B4F72;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Restablecer contrasena</a>
                </div>
                <p style="color:#9ca3af;font-size:13px;">Este enlace expirara en 1 hora.</p>
                <p style="color:#9ca3af;font-size:13px;">Si no solicitaste este cambio, ignora este mensaje.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendPaymentConfirmation(to: string, paymentDetails: PaymentEmailData): Promise<void> {
    this.logger.log(`Sending payment confirmation to ${to}`);

    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email.');
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Confirmacion de pago - ${paymentDetails.cycleName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background-color:#1B4F72;border-radius:8px 8px 0 0;padding:24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">UPAM</h1>
                <p style="color:#93c5fd;margin:4px 0 0;font-size:12px;">Universidad Panamericana de El Salvador</p>
              </div>
              <div style="background-color:white;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
                <h2 style="color:#16a34a;margin-top:0;">Pago confirmado</h2>
                <p style="color:#4b5563;">Estimado(a) <strong>${paymentDetails.studentName}</strong>,</p>
                <p style="color:#4b5563;">Su pago ha sido procesado exitosamente:</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Ciclo</td>
                    <td style="padding:8px 0;color:#1f2937;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${paymentDetails.cycleName}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Tipo</td>
                    <td style="padding:8px 0;color:#1f2937;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${paymentDetails.type === 'tuition' ? 'Matricula' : `Mensualidad`}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Monto</td>
                    <td style="padding:8px 0;color:#16a34a;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;font-size:18px;">$${paymentDetails.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;">Referencia</td>
                    <td style="padding:8px 0;color:#1f2937;text-align:right;font-family:monospace;font-size:13px;">${paymentDetails.reference}</td>
                  </tr>
                </table>
                <p style="color:#9ca3af;font-size:13px;">Este es un comprobante automatico. Para consultas, contacte a la administracion.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      this.logger.log(`Payment confirmation email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation email: ${error.message}`);
    }
  }

  async sendEnrollmentConfirmation(to: string, enrollmentDetails: EnrollmentEmailData): Promise<void> {
    this.logger.log(`Sending enrollment confirmation to ${to}`);

    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email.');
      return;
    }

    const subjectsList = enrollmentDetails.subjects
      .map((s) => `<li style="padding:4px 0;color:#4b5563;">${s}</li>`)
      .join('');

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: `Inscripcion confirmada - ${enrollmentDetails.cycleName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background-color:#1B4F72;border-radius:8px 8px 0 0;padding:24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">UPAM</h1>
                <p style="color:#93c5fd;margin:4px 0 0;font-size:12px;">Universidad Panamericana de El Salvador</p>
              </div>
              <div style="background-color:white;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
                <h2 style="color:#1B4F72;margin-top:0;">Inscripcion confirmada</h2>
                <p style="color:#4b5563;">Estimado(a) <strong>${enrollmentDetails.studentName}</strong>,</p>
                <p style="color:#4b5563;">Su inscripcion para <strong>${enrollmentDetails.cycleName}</strong> ha sido confirmada.</p>
                <h3 style="color:#374151;margin-top:24px;">Materias inscritas:</h3>
                <ul style="list-style:none;padding:0;margin:0;">${subjectsList}</ul>
                <div style="background-color:#f0fdf4;border-radius:6px;padding:12px 16px;margin-top:16px;text-align:center;">
                  <span style="color:#16a34a;font-size:24px;font-weight:bold;">${enrollmentDetails.totalCredits}</span>
                  <span style="color:#6b7280;font-size:14px;margin-left:4px;">creditos totales</span>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      this.logger.log(`Enrollment confirmation email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send enrollment confirmation email: ${error.message}`);
    }
  }
}
