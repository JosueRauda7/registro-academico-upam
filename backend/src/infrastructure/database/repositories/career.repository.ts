import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from '../entities/career.entity';

@Injectable()
export class CareerRepository {
  constructor(
    @InjectRepository(Career)
    private readonly repo: Repository<Career>,
  ) {}

  async findById(id: string): Promise<Career | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveById(id: string): Promise<Career | null> {
    return this.repo.findOne({ where: { id, isActive: true } });
  }

  async findByName(name: string): Promise<Career | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findActiveByName(name: string): Promise<Career | null> {
    return this.repo.findOne({ where: { name, isActive: true } });
  }

  async findByCode(code: string): Promise<Career | null> {
    return this.repo.findOne({ where: { code } });
  }

  async findAll(activeOnly = false): Promise<Career[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async create(data: Partial<Career>): Promise<Career> {
    const career = this.repo.create(data);
    return this.repo.save(career);
  }

  async update(id: string, data: Partial<Career>): Promise<Career | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<Career | null> {
    return this.update(id, { isActive: false });
  }

  async reactivate(id: string): Promise<Career | null> {
    return this.update(id, { isActive: true });
  }

  async count(): Promise<number> {
    return this.repo.count({ where: { isActive: true } });
  }
}