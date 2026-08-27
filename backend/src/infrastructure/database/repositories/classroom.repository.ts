import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../entities/classroom.entity';

@Injectable()
export class ClassroomRepository {
  constructor(
    @InjectRepository(Classroom)
    private readonly repo: Repository<Classroom>,
  ) {}

  async findById(id: string): Promise<Classroom | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(activeOnly = false): Promise<Classroom[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async create(data: Partial<Classroom>): Promise<Classroom> {
    const classroom = this.repo.create(data);
    return this.repo.save(classroom);
  }

  async update(id: string, data: Partial<Classroom>): Promise<Classroom | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<Classroom | null> {
    return this.update(id, { isActive: false });
  }

  async count(): Promise<number> {
    return this.repo.count({ where: { isActive: true } });
  }
}