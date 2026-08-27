import { Injectable, NotFoundException } from '@nestjs/common';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { ScheduleRepository } from '../../infrastructure/database/repositories/schedule.repository';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly scheduleRepository: ScheduleRepository,
  ) {}

  async findAll(career?: string) {
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
    return this.subjectRepository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.subjectRepository.update(id, data);
  }

  async createSchedule(data: any) {
    return this.scheduleRepository.create(data);
  }

  async findSchedulesByCycle(cycleId: string) {
    return this.scheduleRepository.findByCycle(cycleId);
  }
}
