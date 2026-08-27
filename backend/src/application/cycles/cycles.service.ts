import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';

@Injectable()
export class CyclesService {
  constructor(private readonly cycleRepository: CycleRepository) {}

  async findAll() {
    return this.cycleRepository.findAll();
  }

  async findActive() {
    return this.cycleRepository.findActive();
  }

  async findOpenForEnrollment() {
    const cycle = await this.cycleRepository.findOpenForEnrollment();
    if (!cycle) {
      throw new NotFoundException('No hay ciclos abiertos para inscripción');
    }
    return cycle;
  }

  async findById(id: string) {
    const cycle = await this.cycleRepository.findById(id);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }
    return cycle;
  }

  async create(data: {
    name: string;
    year: number;
    semester: number;
    startDate: string;
    endDate: string;
    tuitionAmount: number;
    monthlyAmount: number;
    monthlyCount: number;
  }) {
    return this.cycleRepository.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: true,
      enrollmentOpen: false,
    });
  }

  async update(id: string, data: Partial<any>) {
    const cycle = await this.findById(id);
    return this.cycleRepository.update(id, data);
  }

  async openEnrollment(id: string) {
    const cycle = await this.findById(id);
    return this.cycleRepository.update(id, { enrollmentOpen: true });
  }

  async closeEnrollment(id: string) {
    const cycle = await this.findById(id);
    return this.cycleRepository.update(id, { enrollmentOpen: false });
  }
}
