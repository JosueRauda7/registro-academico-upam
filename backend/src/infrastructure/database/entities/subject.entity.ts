import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { SubjectGroup } from './subject-group.entity';
import { EnrollmentSubject } from './enrollment-subject.entity';
import { Prerequisite } from './prerequisite.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  credits: number;

  @Column()
  career: string;

  @Column()
  year: number;

  @Column()
  semester: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => SubjectGroup, (group) => group.subject)
  groups: SubjectGroup[];

  @OneToMany(() => EnrollmentSubject, (es) => es.subject)
  enrollmentSubjects: EnrollmentSubject[];

  @OneToMany(() => Prerequisite, (prereq) => prereq.subject)
  prerequisites: Prerequisite[];

  @OneToMany(() => Prerequisite, (prereq) => prereq.prerequisiteSubject)
  requiredBy: Prerequisite[];
}
