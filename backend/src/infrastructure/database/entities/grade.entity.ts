import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EnrollmentSubject } from './enrollment-subject.entity';
import { Teacher } from './teacher.entity';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enrollment_subject_id' })
  enrollmentSubjectId: string;

  @ManyToOne(() => EnrollmentSubject, (es) => es.grades)
  @JoinColumn({ name: 'enrollment_subject_id' })
  enrollmentSubject: EnrollmentSubject;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'enum', enum: ['approved', 'failed'] })
  status: 'approved' | 'failed';

  @Column({ name: 'graded_by', type: 'uuid', nullable: true })
  gradedById: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.grades, { nullable: true })
  @JoinColumn({ name: 'graded_by' })
  gradedBy: Teacher;

  @CreateDateColumn({ name: 'graded_at' })
  gradedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}