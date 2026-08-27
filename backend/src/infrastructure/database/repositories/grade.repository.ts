import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities/grade.entity';

@Injectable()
export class GradeRepository {
  constructor(
    @InjectRepository(Grade)
    private readonly repo: Repository<Grade>,
  ) {}

  async findById(id: string): Promise<Grade | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEnrollmentSubject(enrollmentSubjectId: string): Promise<Grade | null> {
    return this.repo.findOne({ where: { enrollmentSubjectId } });
  }

  async findByStudent(studentId: string): Promise<Grade[]> {
    return this.repo
      .createQueryBuilder('grade')
      .innerJoinAndSelect('grade.enrollmentSubject', 'es')
      .innerJoinAndSelect('es.subject', 'subject')
      .innerJoinAndSelect('es.enrollment', 'enrollment')
      .innerJoinAndSelect('enrollment.cycle', 'cycle')
      .where('enrollment.studentId = :studentId', { studentId })
      .orderBy('cycle.year', 'DESC')
      .addOrderBy('cycle.semester', 'DESC')
      .getMany();
  }

  async findByGroup(groupId: string): Promise<Grade[]> {
    return this.repo
      .createQueryBuilder('grade')
      .innerJoinAndSelect('grade.enrollmentSubject', 'es')
      .innerJoin('es.schedule', 'schedule')
      .innerJoin('schedule.group', 'group')
      .innerJoin('es.enrollment', 'enrollment')
      .where('group.id = :groupId', { groupId })
      .andWhere('enrollment.status = :status', { status: 'active' })
      .andWhere('es.status != :cancelled', { cancelled: 'cancelled' })
      .getMany();
  }

  async upsert(grade: {
    enrollmentSubjectId: string;
    score: number;
    status: 'approved' | 'failed';
    gradedById?: string;
  }): Promise<Grade> {
    const existing = await this.findByEnrollmentSubject(grade.enrollmentSubjectId);
    if (existing) {
      existing.score = grade.score;
      existing.status = grade.status;
      if (grade.gradedById) existing.gradedById = grade.gradedById;
      existing.gradedAt = new Date();
      return this.repo.save(existing);
    }
    const created = this.repo.create(grade);
    return this.repo.save(created);
  }
}