import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrollmentSubject } from '../entities/enrollment-subject.entity';
import { EnrollmentSubjectStatus } from '../../../domain/enums/enrollment-status.enum';

@Injectable()
export class EnrollmentSubjectRepository {
  constructor(
    @InjectRepository(EnrollmentSubject)
    private readonly repo: Repository<EnrollmentSubject>,
  ) {}

  async findById(id: string): Promise<EnrollmentSubject | null> {
    return this.repo.findOne({ where: { id }, relations: ['subject', 'schedule', 'enrollment'] });
  }

  async findByEnrollment(enrollmentId: string): Promise<EnrollmentSubject[]> {
    return this.repo.find({
      where: { enrollmentId },
      relations: ['subject', 'schedule'],
    });
  }

  async findByEnrollmentAndSubject(enrollmentId: string, subjectId: string): Promise<EnrollmentSubject | null> {
    return this.repo.findOne({
      where: { enrollmentId, subjectId },
      relations: ['subject', 'schedule'],
    });
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
      .innerJoin('es.schedule', 'schedule')
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
      .where('enrollment.studentId = :studentId', { studentId })
      .andWhere('es.subjectId = :subjectId', { subjectId })
      .andWhere('cycle.year < :currentYear', { currentYear: new Date().getFullYear() })
      .getCount();
    return count > 0;
  }
}
