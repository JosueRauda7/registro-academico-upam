import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrollmentSubject } from '../entities/enrollment-subject.entity';
import { EnrollmentSubjectStatus } from '../../../domain/enums/enrollment-status.enum';

const ES_RELATIONS = [
  'subject',
  'schedule',
  'schedule.group',
  'schedule.group.subject',
  'schedule.group.teacher',
  'schedule.group.classroom',
];

@Injectable()
export class EnrollmentSubjectRepository {
  constructor(
    @InjectRepository(EnrollmentSubject)
    private readonly repo: Repository<EnrollmentSubject>,
  ) {}

  async findById(id: string): Promise<EnrollmentSubject | null> {
    return this.repo.findOne({ where: { id }, relations: ES_RELATIONS });
  }

  async findByEnrollment(enrollmentId: string): Promise<EnrollmentSubject[]> {
    return this.repo.find({
      where: { enrollmentId },
      relations: ES_RELATIONS,
    });
  }

  async findByEnrollmentAndSubject(enrollmentId: string, subjectId: string): Promise<EnrollmentSubject | null> {
    return this.repo.findOne({
      where: { enrollmentId, subjectId },
      relations: ES_RELATIONS,
    });
  }

  async findByStudentWithCycle(studentId: string): Promise<EnrollmentSubject[]> {
    return this.repo
      .createQueryBuilder('es')
      .innerJoinAndSelect('es.enrollment', 'enrollment')
      .innerJoinAndSelect('enrollment.cycle', 'cycle')
      .innerJoinAndSelect('es.subject', 'subject')
      .where('enrollment.studentId = :studentId', { studentId })
      .getMany();
  }

  async findByGroup(groupId: string): Promise<EnrollmentSubject[]> {
    return this.repo
      .createQueryBuilder('es')
      .innerJoinAndSelect('es.enrollment', 'enrollment')
      .innerJoinAndSelect('enrollment.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .innerJoinAndSelect('enrollment.cycle', 'cycle')
      .innerJoinAndSelect('es.subject', 'subject')
      .innerJoinAndSelect('es.schedule', 'schedule')
      .innerJoinAndSelect('schedule.group', 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('enrollment.status = :status', { status: 'active' })
      .andWhere('es.status != :cancelled', { cancelled: EnrollmentSubjectStatus.CANCELLED })
      .orderBy('student.studentCode', 'ASC')
      .getMany();
  }

  async create(data: Partial<EnrollmentSubject>): Promise<EnrollmentSubject> {
    const es = this.repo.create(data);
    return this.repo.save(es);
  }

  async update(id: string, data: Partial<EnrollmentSubject>): Promise<EnrollmentSubject | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async countBySubjectInCycle(subjectId: string, cycleId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('es')
      .innerJoin('es.enrollment', 'enrollment')
      .where('es.subjectId = :subjectId', { subjectId })
      .andWhere('enrollment.cycleId = :cycleId', { cycleId })
      .andWhere('enrollment.status = :status', { status: 'active' })
      .andWhere('es.status != :cancelled', { cancelled: EnrollmentSubjectStatus.CANCELLED })
      .getCount();
  }

  async hasCompletedSubject(studentId: string, subjectId: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('es')
      .innerJoin('es.enrollment', 'enrollment')
      .innerJoin('enrollment.cycle', 'cycle')
      .innerJoin('es.grades', 'grade')
      .where('enrollment.studentId = :studentId', { studentId })
      .andWhere('es.subjectId = :subjectId', { subjectId })
      .andWhere('es.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('grade.status = :approved', { approved: 'approved' })
      .getCount();
    return count > 0;
  }

  async countByGroup(groupId: string, cycleId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('es')
      .innerJoin('es.schedule', 'schedule')
      .innerJoin('es.enrollment', 'enrollment')
      .innerJoin('schedule.group', 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('enrollment.cycleId = :cycleId', { cycleId })
      .andWhere('group.cycleId = :cycleId', { cycleId })
      .andWhere('es.status != :cancelled', { cancelled: EnrollmentSubjectStatus.CANCELLED })
      .getCount();
  }

  async checkScheduleInUse(scheduleId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('es')
      .where('es.scheduleId = :scheduleId', { scheduleId })
      .andWhere('es.status != :cancelled', { cancelled: EnrollmentSubjectStatus.CANCELLED })
      .getCount();
  }
}