import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentGateway,
  WompiPaymentRequest,
  WompiPaymentResponse,
} from '../../domain/interfaces/payment-gateway.interface';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

@Injectable()
export class WompiGateway implements IPaymentGateway {
  private readonly logger = new Logger(WompiGateway.name);
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('WOMPI_BASE_URL', 'https://sandbox.wompi.co/v1');
    this.publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY', '');
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY', '');
  }

  async createPayment(data: WompiPaymentRequest): Promise<WompiPaymentResponse> {
    this.logger.log(`Creating Wompi payment for reference: ${data.reference}`);

    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.privateKey}`,
      },
      body: JSON.stringify({
        amount_in_cents: data.amountInCents,
        currency: data.currency || 'USD',
        reference: data.reference,
        customer_email: data.customerEmail,
        payment_method: data.paymentMethod || {
          type: 'CARD',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`Wompi payment error: ${JSON.stringify(error)}`);
      throw new Error(`Payment creation failed: ${JSON.stringify(error)}`);
    }

    return response.json() as Promise<WompiPaymentResponse>;
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentStatus> {
    const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get transaction status');
    }

    const data = await response.json();
    return this.mapWompiStatus(data.data.status);
  }

  async createWidget(orderId: string): Promise<string> {
    return `${this.baseUrl}/widget?orderId=${orderId}&publicKey=${this.publicKey}`;
  }

  generateReference(): string {
    return `UPAM-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  private mapWompiStatus(wompiStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      APPROVED: PaymentStatus.COMPLETED,
      DECLINED: PaymentStatus.FAILED,
      PENDING: PaymentStatus.PENDING,
      ERROR: PaymentStatus.FAILED,
      VOIDED: PaymentStatus.REFUNDED,
    };
    return statusMap[wompiStatus] || PaymentStatus.PENDING;
  }
}
