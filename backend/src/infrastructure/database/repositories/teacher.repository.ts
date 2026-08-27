import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';

@Injectable()
export class TeacherRepository {
  constructor(
    @InjectRepository(Teacher)
    private readonly repo: Repository<Teacher>,
  ) {}

  async findById(id: string): Promise<Teacher | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Teacher | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async findAll(activeOnly = false): Promise<Teacher[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async create(data: Partial<Teacher>): Promise<Teacher> {
    const teacher = this.repo.create(data);
    return this.repo.save(teacher);
  }

  async update(id: string, data: Partial<Teacher>): Promise<Teacher | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<Teacher | null> {
    return this.update(id, { isActive: false });
  }

  async count(): Promise<number> {
    return this.repo.count({ where: { isActive: true } });
  }
}