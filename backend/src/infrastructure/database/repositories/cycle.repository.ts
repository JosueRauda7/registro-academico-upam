import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cycle } from '../entities/cycle.entity';

@Injectable()
export class CycleRepository {
  constructor(
    @InjectRepository(Cycle)
    private readonly repo: Repository<Cycle>,
  ) {}

  async findById(id: string): Promise<Cycle | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActive(): Promise<Cycle[]> {
    return this.repo.find({ where: { isActive: true }, order: { year: 'DESC', semester: 'DESC' } });
  }

  async findOpenForEnrollment(): Promise<Cycle | null> {
    return this.repo.findOne({ where: { isActive: true, enrollmentOpen: true } });
  }

  async create(data: Partial<Cycle>): Promise<Cycle> {
    const cycle = this.repo.create(data);
    return this.repo.save(cycle);
  }

  async update(id: string, data: Partial<Cycle>): Promise<Cycle | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async findAll(): Promise<Cycle[]> {
    return this.repo.find({ order: { year: 'DESC', semester: 'DESC' } });
  }
}
