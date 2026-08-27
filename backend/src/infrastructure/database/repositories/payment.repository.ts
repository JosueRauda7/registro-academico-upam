import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { PaymentType } from '../../../domain/enums/payment-type.enum';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  async findById(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id }, relations: ['student', 'student.user', 'cycle'] });
  }

  async findByReference(reference: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { reference }, relations: ['student', 'student.user', 'cycle'] });
  }

  async findByStudent(studentId: string): Promise<Payment[]> {
    return this.repo.find({
      where: { studentId },
      relations: ['cycle'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudentAndCycle(studentId: string, cycleId: string): Promise<Payment[]> {
    return this.repo.find({
      where: { studentId, cycleId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudentAndType(studentId: string, type: PaymentType): Promise<Payment[]> {
    return this.repo.find({
      where: { studentId, type },
      relations: ['cycle'],
      order: { createdAt: 'DESC' },
    });
  }

  async findTuitionPayment(studentId: string, cycleId: string): Promise<Payment | null> {
    return this.repo.findOne({
      where: { studentId, cycleId, type: PaymentType.TUITION, status: PaymentStatus.COMPLETED },
    });
  }

  async hasTuitionPayment(studentId: string, cycleId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { studentId, cycleId, type: PaymentType.TUITION, status: PaymentStatus.COMPLETED },
    });
    return count > 0;
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.repo.create(data);
    return this.repo.save(payment);
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async sumCompletedByCycle(cycleId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.cycleId = :cycleId', { cycleId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();
    return parseFloat(result?.total || '0');
  }
}
