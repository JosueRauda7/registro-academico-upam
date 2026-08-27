import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { ScheduleRepository } from '../../infrastructure/database/repositories/schedule.repository';
import { SubjectGroupRepository } from '../../infrastructure/database/repositories/subject-group.repository';
import { CareerRepository } from '../../infrastructure/database/repositories/career.repository';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly subjectGroupRepository: SubjectGroupRepository,
    private readonly careerRepository: CareerRepository,
  ) {}

  async findAll(career?: string, all = false) {
    if (all) {
      return this.subjectRepository.findAllIncludingInactive();
    }
    if (career) {
      return this.subjectRepository.findByCareer(career);
    }
    return this.subjectRepository.findAll();
  }

  async findById(id: string) {
    const subject = await this.subjectRepository.findById(id);
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    return subject;
  }

  async findByCode(code: string) {
    const subject = await this.subjectRepository.findByCode(code);
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    return subject;
  }

  async findSchedules(subjectId: string, cycleId: string) {
    return this.scheduleRepository.findByCycleAndSubject(cycleId, subjectId);
  }

  async getPrerequisites(subjectId: string) {
    return this.subjectRepository.findPrerequisites(subjectId);
  }

  async create(data: any) {
    await this.validateCareer(data.career);
    return this.subjectRepository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    if (data.career !== undefined) {
      await this.validateCareer(data.career);
    }
    return this.subjectRepository.update(id, data);
  }

  private async validateCareer(career?: string) {
    if (!career) return;
    const found = await this.careerRepository.findActiveByName(career);
    if (!found) {
      throw new ConflictException('La carrera especificada no existe o esta inactiva');
    }
  }

  async remove(id: string) {
    const subject = await this.findById(id);
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    return this.subjectRepository.deactivate(id);
  }

  async createSchedule(data: any) {
    if (!data.groupId) {
      throw new BadRequestException('Se requiere el groupId del grupo');
    }
    return this.scheduleRepository.create({
      groupId: data.groupId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });
  }

  async findSchedulesByCycle(cycleId: string) {
    return this.scheduleRepository.findByCycle(cycleId);
  }

  async findGroupsByCycle(cycleId: string) {
    return this.subjectGroupRepository.findByCycleActive(cycleId);
  }
}
