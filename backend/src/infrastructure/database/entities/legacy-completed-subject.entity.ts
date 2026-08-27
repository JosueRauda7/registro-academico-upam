import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { StudentEntity } from './student.entity';
import { Subject } from './subject.entity';
import { User } from './user.entity';

@Entity('legacy_completed_subjects')
export class LegacyCompletedSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => StudentEntity, (student) => student.id)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.id)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'int', nullable: true })
  semester: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'registered_by', type: 'uuid', nullable: true })
  registeredById: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'registered_by' })
  registeredBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
