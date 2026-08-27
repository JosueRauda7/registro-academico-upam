import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Subject } from './subject.entity';
import { Cycle } from './cycle.entity';
import { EnrollmentSubject } from './enrollment-subject.entity';
import { DayOfWeek } from '../../../domain/enums/day-of-week.enum';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.schedules)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => Cycle, (cycle) => cycle.schedules)
  @JoinColumn({ name: 'cycle_id' })
  cycle: Cycle;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column()
  classroom: string;

  @Column({ default: 40 })
  capacity: number;

  @Column({ name: 'enrolled_count', default: 0 })
  enrolledCount: number;

  @OneToMany(() => EnrollmentSubject, (es) => es.schedule)
  enrollmentSubjects: EnrollmentSubject[];
}
