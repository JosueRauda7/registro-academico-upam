import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Subject } from './subject.entity';
import { Schedule } from './schedule.entity';
import { EnrollmentSubjectStatus } from '../../../domain/enums/enrollment-status.enum';

@Entity('enrollment_subjects')
export class EnrollmentSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enrollment_id' })
  enrollmentId: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.subjects)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.enrollmentSubjects)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'schedule_id' })
  scheduleId: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.enrollmentSubjects)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ type: 'enum', enum: EnrollmentSubjectStatus, default: EnrollmentSubjectStatus.RESERVED })
  status: EnrollmentSubjectStatus;

  @CreateDateColumn({ name: 'reserved_at' })
  reservedAt: Date;
}
