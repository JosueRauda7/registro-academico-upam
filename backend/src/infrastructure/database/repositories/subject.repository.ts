import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';

@Injectable()
export class SubjectRepository {
  constructor(
    @InjectRepository(Subject)
    private readonly repo: Repository<Subject>,
  ) {}

  async findById(id: string): Promise<Subject | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
    });
  }

  async findByCode(code: string): Promise<Subject | null> {
    return this.repo.findOne({ where: { code } });
  }

  async findByCareer(career: string): Promise<Subject[]> {
    return this.repo.find({
      where: { career, isActive: true },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
      order: { year: 'ASC', semester: 'ASC' },
    });
  }

  async findAll(): Promise<Subject[]> {
    return this.repo.find({
      where: { isActive: true },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
      order: { year: 'ASC', semester: 'ASC', code: 'ASC' },
    });
  }

  async findAllIncludingInactive(): Promise<Subject[]> {
    return this.repo.find({
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
      order: { year: 'ASC', semester: 'ASC', code: 'ASC' },
    });
  }

  async countActiveByCareer(career: string): Promise<number> {
    return this.repo.count({ where: { career, isActive: true } });
  }

  async create(data: Partial<Subject>): Promise<Subject> {
    const subject = this.repo.create(data);
    return this.repo.save(subject);
  }

  async update(id: string, data: Partial<Subject>): Promise<Subject | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<Subject | null> {
    await this.repo.update(id, { isActive: false });
    return this.findById(id);
  }

  async findPrerequisites(subjectId: string): Promise<Subject[]> {
    const subject = await this.repo.findOne({
      where: { id: subjectId },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
    });
    if (!subject) return [];
    return subject.prerequisites.map((p) => p.prerequisiteSubject);
  }
}
