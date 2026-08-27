import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegacyCompletedSubject } from '../entities/legacy-completed-subject.entity';

const RELATIONS = ['student', 'student.user', 'subject'];

@Injectable()
export class LegacyCompletedSubjectRepository {
  constructor(
    @InjectRepository(LegacyCompletedSubject)
    private readonly repo: Repository<LegacyCompletedSubject>,
  ) {}

  async findByStudent(studentId: string): Promise<LegacyCompletedSubject[]> {
    return this.repo.find({
      where: { studentId },
      relations: RELATIONS,
      order: { year: 'DESC', semester: 'DESC' },
    });
  }

  async findAll(): Promise<LegacyCompletedSubject[]> {
    return this.repo.find({
      relations: RELATIONS,
      order: { year: 'DESC', semester: 'DESC' },
    });
  }

  async findById(id: string): Promise<LegacyCompletedSubject | null> {
    return this.repo.findOne({ where: { id }, relations: RELATIONS });
  }

  async create(data: Partial<LegacyCompletedSubject>): Promise<LegacyCompletedSubject> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<LegacyCompletedSubject>): Promise<LegacyCompletedSubject | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
