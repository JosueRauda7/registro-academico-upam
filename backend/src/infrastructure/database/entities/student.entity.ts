import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Enrollment } from './enrollment.entity';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.students)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'student_code', unique: true })
  studentCode: string;

  @Column({ unique: true })
  carnet: string;

  @Column()
  career: string;

  @Column({ name: 'enrollment_year' })
  enrollmentYear: number;

  @Column({ name: 'tuition_amount', type: 'numeric', precision: 10, scale: 2, nullable: true,
    transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) } })
  tuitionAmount: number | null;

  @Column({ name: 'monthly_amount', type: 'numeric', precision: 10, scale: 2, nullable: true,
    transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) } })
  monthlyAmount: number | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
