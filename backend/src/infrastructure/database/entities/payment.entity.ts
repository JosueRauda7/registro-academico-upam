import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';
import { Cycle } from './cycle.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { PaymentType } from '../../../domain/enums/payment-type.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => StudentEntity, (student) => student.user)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => Cycle, (cycle) => cycle.payments)
  @JoinColumn({ name: 'cycle_id' })
  cycle: Cycle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date | null;

  @Column({ name: 'payment_method', default: 'wompi' })
  paymentMethod: string;

  @Column({ name: 'wompi_transaction_id', type: 'varchar', nullable: true })
  wompiTransactionId: string | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({ type: 'int', nullable: true })
  month: number | null;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', unique: true })
  reference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
