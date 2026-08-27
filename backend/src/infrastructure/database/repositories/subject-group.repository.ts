import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectGroup } from '../entities/subject-group.entity';

@Injectable()
export class SubjectGroupRepository {
  constructor(
    @InjectRepository(SubjectGroup)
    private readonly repo: Repository<SubjectGroup>,
  ) {}

  async findById(id: string): Promise<SubjectGroup | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['subject', 'cycle', 'teacher', 'classroom', 'schedules'],
    });
  }

  async findByCycle(cycleId: string): Promise<SubjectGroup[]> {
    return this.repo.find({
      where: { cycleId },
      relations: ['subject', 'cycle', 'teacher', 'classroom', 'schedules'],
      order: { groupNumber: 'ASC' },
    });
  }

  async findByCycleAndSubject(cycleId: string, subjectId: string): Promise<SubjectGroup[]> {
    return this.repo.find({
      where: { cycleId, subjectId, isActive: true },
      relations: ['subject', 'cycle', 'teacher', 'classroom', 'schedules'],
      order: { groupNumber: 'ASC' },
    });
  }

  async findByIdWithEnrollments(id: string): Promise<SubjectGroup | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['subject', 'cycle', 'teacher', 'classroom', 'schedules', 'schedules.enrollmentSubjects'],
    });
  }

  async findByCycleActive(cycleId: string): Promise<SubjectGroup[]> {
    return this.repo.find({
      where: { cycleId, isActive: true },
      relations: ['subject', 'cycle', 'teacher', 'classroom', 'schedules'],
      order: { groupNumber: 'ASC' },
    });
  }

  async findByTeacher(teacherId: string): Promise<SubjectGroup[]> {
    return this.repo.find({
      where: { teacherId, isActive: true },
      relations: ['subject', 'cycle', 'teacher', 'classroom', 'schedules'],
      order: { groupNumber: 'ASC' },
    });
  }

  async incrementEnrolledCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'enrolledCount', 1);
  }

  async decrementEnrolledCount(id: string): Promise<void> {
    await this.repo.decrement({ id }, 'enrolledCount', 1);
  }

  async create(data: Partial<SubjectGroup>): Promise<SubjectGroup> {
    const group = this.repo.create(data);
    return this.repo.save(group);
  }

  async update(id: string, data: Partial<SubjectGroup>): Promise<SubjectGroup | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async countByCycle(cycleId: string): Promise<number> {
    return this.repo.count({ where: { cycleId } });
  }
}