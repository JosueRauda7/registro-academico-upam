import { PlanningRepository } from '../../infrastructure/database/repositories/planning.repository';
import { CreateSubjectScheduleDto } from '../subject-groups/dto/group.dto';
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { ScheduleRepository } from '../../infrastructure/database/repositories/schedule.repository';
import { SubjectGroupRepository } from '../../infrastructure/database/repositories/subject-group.repository';
import { CareerRepository } from '../../infrastructure/database/repositories/career.repository';
import { PrerequisiteRepository } from '../../infrastructure/database/repositories/prerequisite.repository';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly subjectGroupRepository: SubjectGroupRepository,
    private readonly careerRepository: CareerRepository,
    private readonly prerequisiteRepository: PrerequisiteRepository,
    private readonly planning: PlanningRepository,
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
    const { subjectData, ids } = this.prerequisiteInput(data);
    const subject = await this.subjectRepository.saveWithPrerequisites(undefined, subjectData, ids ?? []);
    return this.subjectRepository.findById(subject.id);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    if (data.career !== undefined) {
      await this.validateCareer(data.career);
    }
    const { subjectData, ids } = this.prerequisiteInput(data);
    await this.subjectRepository.saveWithPrerequisites(id, subjectData, ids);
    return this.subjectRepository.findById(id);
  }

  private prerequisiteInput(data: any) {
    const { prerequisiteSubjectId, prerequisiteSubjectIds, ...subjectData } = data;
    if (Object.values(subjectData).some(value => value === null)) throw new BadRequestException('Los campos de la materia no admiten null.');
    if (prerequisiteSubjectIds !== undefined && prerequisiteSubjectId !== undefined) throw new BadRequestException('Envía prerequisiteSubjectIds o prerequisiteSubjectId, no ambos.');
    if (prerequisiteSubjectIds !== undefined && !Array.isArray(prerequisiteSubjectIds)) throw new BadRequestException('prerequisiteSubjectIds debe ser una lista.');
    const ids: string[] | undefined = prerequisiteSubjectIds ?? (prerequisiteSubjectId === undefined ? undefined : prerequisiteSubjectId ? [prerequisiteSubjectId] : []);
    return { subjectData, ids };
  }

  private async validateCareer(career?: string) {
    if (!career) return;
    const found = await this.careerRepository.findActiveByName(career);
    if (!found) {
      throw new ConflictException('La carrera especificada no existe o está inactiva');
    }
  }

  async remove(id: string) {
    const subject = await this.findById(id);
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    return this.subjectRepository.deactivate(id);
  }

  createSchedule(data: CreateSubjectScheduleDto) {
    const { groupId, ...schedule } = data;
    return this.planning.addSchedule(groupId, schedule);
  }

  async findSchedulesByCycle(cycleId: string) {
    return this.scheduleRepository.findByCycle(cycleId);
  }

  async findGroupsByCycle(cycleId: string) {
    return this.subjectGroupRepository.findByCycleActive(cycleId);
  }
}
