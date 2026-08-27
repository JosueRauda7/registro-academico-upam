import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Payment } from './payment.entity';
import { SubjectGroup } from './subject-group.entity';

@Entity('cycles')
export class Cycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  year: number;

  @Column()
  semester: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'tuition_amount', type: 'decimal', precision: 10, scale: 2 })
  tuitionAmount: number;

  @Column({ name: 'monthly_amount', type: 'decimal', precision: 10, scale: 2 })
  monthlyAmount: number;

  @Column({ name: 'monthly_count', default: 4 })
  monthlyCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'enrollment_open', default: false })
  enrollmentOpen: boolean;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.cycle)
  enrollments: Enrollment[];

  @OneToMany(() => Payment, (payment) => payment.cycle)
  payments: Payment[];

  @OneToMany(() => SubjectGroup, (group) => group.cycle)
  groups: SubjectGroup[];
}
