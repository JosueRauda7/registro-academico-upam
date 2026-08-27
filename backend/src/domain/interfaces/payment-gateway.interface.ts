import { PaymentStatus } from '../enums/payment-status.enum';

export interface WompiPaymentRequest {
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string;
  paymentMethod?: {
    type: string;
    token?: string;
    installments?: number;
  };
}

export interface WompiPaymentResponse {
  data: {
    id: string;
    status: string;
    reference: string;
    amount_in_cents: number;
    currency: string;
    created_at: string;
    payment_method: Record<string, any>;
  };
}

export interface WompiTransactionEvent {
  event: string;
  transaction: {
    id: string;
    status: string;
    reference: string;
    amount_in_cents: number;
  };
}

export interface IPaymentGateway {
  createPayment(data: WompiPaymentRequest): Promise<WompiPaymentResponse>;
  getTransactionStatus(transactionId: string): Promise<PaymentStatus>;
  createWidget(orderId: string): Promise<string>;
}
