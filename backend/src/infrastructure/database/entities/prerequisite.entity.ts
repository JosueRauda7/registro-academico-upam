import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Subject } from './subject.entity';

@Entity('prerequisites')
export class Prerequisite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.prerequisites)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'prerequisite_subject_id' })
  prerequisiteSubjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.requiredBy)
  @JoinColumn({ name: 'prerequisite_subject_id' })
  prerequisiteSubject: Subject;
}
