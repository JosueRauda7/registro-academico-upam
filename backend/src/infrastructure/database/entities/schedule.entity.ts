import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SubjectGroup } from './subject-group.entity';
import { EnrollmentSubject } from './enrollment-subject.entity';
import { DayOfWeek } from '../../../domain/enums/day-of-week.enum';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @ManyToOne(() => SubjectGroup, (group) => group.schedules)
  @JoinColumn({ name: 'group_id' })
  group: SubjectGroup;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @OneToMany(() => EnrollmentSubject, (es) => es.schedule)
  enrollmentSubjects: EnrollmentSubject[];
}