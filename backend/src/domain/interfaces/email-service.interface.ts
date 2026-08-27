export interface IEmailService {
  sendPasswordResetEmail(to: string, resetToken: string): Promise<void>;
  sendPaymentConfirmation(to: string, paymentDetails: PaymentEmailData): Promise<void>;
  sendEnrollmentConfirmation(to: string, enrollmentDetails: EnrollmentEmailData): Promise<void>;
}

export interface PaymentEmailData {
  studentName: string;
  amount: number;
  cycleName: string;
  type: string;
  reference: string;
}

export interface EnrollmentEmailData {
  studentName: string;
  cycleName: string;
  subjects: string[];
  totalCredits: number;
}
