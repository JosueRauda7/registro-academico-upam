import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IEmailService,
  PaymentEmailData,
  EnrollmentEmailData,
} from '../../domain/interfaces/email-service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`Sending password reset email to ${to}`);
    this.logger.debug(`Reset URL: ${resetUrl}`);

    // In production, use nodemailer or similar
    // const mailOptions = {
    //   from: 'noreply@upam.edu.sv',
    //   to,
    //   subject: 'Recuperación de contraseña - UPAM',
    //   html: `
    //     <h1>Recuperación de contraseña</h1>
    //     <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
    //     <p>Haz clic en el siguiente enlace:</p>
    //     <a href="${resetUrl}">Restablecer contraseña</a>
    //     <p>Este enlace expirará en 1 hora.</p>
    //     <p>Si no solicitaste este cambio, ignora este mensaje.</p>
    //   `,
    // };
    // await this.transporter.sendMail(mailOptions);
  }

  async sendPaymentConfirmation(to: string, paymentDetails: PaymentEmailData): Promise<void> {
    this.logger.log(`Sending payment confirmation to ${to}`);

    // In production, use nodemailer
    // const mailOptions = {
    //   from: 'noreply@upam.edu.sv',
    //   to,
    //   subject: `Confirmación de pago - ${paymentDetails.cycleName}`,
    //   html: `
    //     <h1>Confirmación de pago</h1>
    //     <p>Estimado(a) ${paymentDetails.studentName},</p>
    //     <p>Su pago ha sido procesado exitosamente:</p>
    //     <ul>
    //       <li>Ciclo: ${paymentDetails.cycleName}</li>
    //       <li>Monto: $${paymentDetails.amount.toFixed(2)}</li>
    //       <li>Tipo: ${paymentDetails.type}</li>
    //       <li>Referencia: ${paymentDetails.reference}</li>
    //     </ul>
    //   `,
    // };
    // await this.transporter.sendMail(mailOptions);
  }

  async sendEnrollmentConfirmation(to: string, enrollmentDetails: EnrollmentEmailData): Promise<void> {
    this.logger.log(`Sending enrollment confirmation to ${to}`);

    // In production, use nodemailer
    // const mailOptions = {
    //   from: 'noreply@upam.edu.sv',
    //   to,
    //   subject: `Inscripción confirmada - ${enrollmentDetails.cycleName}`,
    //   html: `
    //     <h1>Inscripción confirmada</h1>
    //     <p>Estimado(a) ${enrollmentDetails.studentName},</p>
    //     <p>Su inscripción para ${enrollmentDetails.cycleName} ha sido confirmada.</p>
    //     <h3>Materias inscritas:</h3>
    //     <ul>${enrollmentDetails.subjects.map((s) => `<li>${s}</li>`).join('')}</ul>
    //     <p>Total de créditos: ${enrollmentDetails.totalCredits}</p>
    //   `,
    // };
    // await this.transporter.sendMail(mailOptions);
  }
}
