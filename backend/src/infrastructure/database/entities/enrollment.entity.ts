import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';
import { Cycle } from './cycle.entity';
import { EnrollmentSubject } from './enrollment-subject.entity';
import { EnrollmentStatus } from '../../../domain/enums/enrollment-status.enum';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => StudentEntity, (student) => student.enrollments)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => Cycle, (cycle) => cycle.enrollments)
  @JoinColumn({ name: 'cycle_id' })
  cycle: Cycle;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ name: 'tuition_paid', default: false })
  tuitionPaid: boolean;

  @OneToMany(() => EnrollmentSubject, (es) => es.enrollment)
  subjects: EnrollmentSubject[];
}
