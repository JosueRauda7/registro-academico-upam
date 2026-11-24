import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { PlanningRepository } from '../../infrastructure/database/repositories/planning.repository';
import { CreateCycleDto, UpdateCycleDto } from './dto/cycle.dto';

@Injectable()
export class CyclesService {
  constructor(private readonly cycleRepository: CycleRepository, private readonly planning: PlanningRepository) {}
  findAll() { return this.cycleRepository.findAll(); }
  findActive() { return this.cycleRepository.findActive(); }
  async findOpenForEnrollment() {
    const cycle = await this.cycleRepository.findOpenForEnrollment();
    if (!cycle) throw new NotFoundException('No hay ciclos abiertos para inscripción');
    return cycle;
  }
  async findById(id: string) {
    const cycle = await this.cycleRepository.findById(id);
    if (!cycle) throw new NotFoundException('Ciclo no encontrado');
    return cycle;
  }
  create(data: CreateCycleDto) {
    return this.planning.saveCycle(undefined, { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate), isActive: true, enrollmentOpen: false });
  }
  update(id: string, data: UpdateCycleDto) {
    if (Object.values(data).some(value => value === null) || Object.keys(data).length === 0) throw new BadRequestException('Envía al menos un campo válido; no se acepta null');
    return this.planning.saveCycle(id, {
      ...data,
      ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate !== undefined ? { endDate: new Date(data.endDate) } : {}),
    } as Parameters<PlanningRepository['saveCycle']>[1]);
  }
  openEnrollment(id: string) { return this.planning.saveCycle(id, { enrollmentOpen: true }); }
  closeEnrollment(id: string) { return this.planning.saveCycle(id, { enrollmentOpen: false }); }
}
