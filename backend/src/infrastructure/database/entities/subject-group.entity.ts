import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from './subject.entity';
import { Cycle } from './cycle.entity';
import { Teacher } from './teacher.entity';
import { Classroom } from './classroom.entity';
import { Schedule } from './schedule.entity';

@Entity('subject_groups')
export class SubjectGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.groups)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'cycle_id' })
  cycleId: string;

  @ManyToOne(() => Cycle, (cycle) => cycle.groups)
  @JoinColumn({ name: 'cycle_id' })
  cycle: Cycle;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string | null;

  @ManyToOne(() => Teacher, (teacher) => teacher.groups)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ name: 'classroom_id' })
  classroomId: string;

  @ManyToOne(() => Classroom, (classroom) => classroom.groups)
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom;

  @Column({ name: 'group_number', default: 1 })
  groupNumber: number;

  @Column()
  capacity: number;

  @Column({ name: 'enrolled_count', default: 0 })
  enrolledCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Schedule, (schedule) => schedule.group)
  schedules: Schedule[];
}