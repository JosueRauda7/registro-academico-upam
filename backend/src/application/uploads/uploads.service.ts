import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PaymentRepository } from '../../infrastructure/database/repositories/payment.repository';
import { UserRole } from '../../domain/enums/role.enum';

const FILE_NAME = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/i;

export const IMAGE_QUALITY = 80;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp') as (input: Buffer | string) => {
  rotate(): any;
  webp(options: { quality: number }): any;
  toFile(path: string): Promise<any>;
};

@Injectable()
export class UploadsService {
  constructor(private readonly payments: PaymentRepository) {}
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async saveImage(file: Express.Multer.File, kind: 'receipts' | 'logos' = 'receipts'): Promise<{ url: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const directory = join(this.uploadDir, kind);
    await fs.mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}.webp`;
    const outputPath = join(directory, filename);

    try {
      await sharp(file.buffer)
        .rotate()
        .webp({ quality: IMAGE_QUALITY })
        .toFile(outputPath);
    } catch {
      throw new BadRequestException('El archivo debe ser una imagen válida (JPG, PNG o WEBP)');
    }

    return { url: kind === 'logos' ? `/uploads/logos/${filename}` : `/api/uploads/receipts/${filename}` };
  }

  async readReceipt(filename: string, actor: { sub: string; role: UserRole }): Promise<Buffer> {
    if (!FILE_NAME.test(filename)) throw new NotFoundException('Comprobante no encontrado');
    const current = `/api/uploads/receipts/${filename}`;
    const payment = await this.payments.findByReceipt(current) ||
      await this.payments.findByReceipt(`/uploads/${filename}`);
    const staff = [UserRole.ADMINISTRATOR, UserRole.COLLECTOR].includes(actor.role);
    if (!staff && (!payment || actor.role !== UserRole.STUDENT || payment.student?.userId !== actor.sub)) {
      throw new NotFoundException('Comprobante no encontrado');
    }
    // Legacy root files remain private and are never served by static middleware.
    const path = payment?.receiptImageUrl?.startsWith('/uploads/')
      ? join(this.uploadDir, filename) : join(this.uploadDir, 'receipts', filename);
    try { return await fs.readFile(path); } catch { throw new NotFoundException('Comprobante no encontrado'); }
  }
}
