import { Injectable, NotFoundException } from '@nestjs/common';
import { SubjectGroupRepository } from '../../infrastructure/database/repositories/subject-group.repository';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { PlanningRepository } from '../../infrastructure/database/repositories/planning.repository';
import { CreateGroupDto, UpdateGroupDto, ScheduleDto } from './dto/group.dto';

@Injectable()
export class SubjectGroupsService {
  constructor(
    private readonly subjectGroupRepository: SubjectGroupRepository,
    private readonly cycleRepository: CycleRepository,
    private readonly planning: PlanningRepository,
  ) {}
  async findAll(cycleId?: string) {
    if (cycleId) return this.subjectGroupRepository.findByCycle(cycleId);
    const cycles = await this.cycleRepository.findAll();
    const groups = await Promise.all(cycles.map(cycle => this.subjectGroupRepository.findByCycle(cycle.id)));
    return groups.flat();
  }
  async findById(id: string) {
    const group = await this.subjectGroupRepository.findById(id);
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }
  create(data: Omit<CreateGroupDto, 'schedules'>, schedules?: ScheduleDto[]) {
    return this.planning.saveGroup(undefined, data, schedules);
  }
  update(id: string, data: UpdateGroupDto) { return this.planning.saveGroup(id, data); }
  remove(id: string) { return this.planning.removeGroup(id); }
  addSchedule(id: string, data: ScheduleDto) { return this.planning.addSchedule(id, data); }
  removeSchedule(groupId: string, scheduleId: string) { return this.planning.removeSchedule(groupId, scheduleId); }
  assignTeacher(id: string, teacherId: string) { return this.update(id, { teacherId }); }
  changeClassroom(id: string, classroomId: string) { return this.update(id, { classroomId }); }
}
