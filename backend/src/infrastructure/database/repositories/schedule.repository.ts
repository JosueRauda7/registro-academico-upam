import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { SubjectGroup } from '../entities/subject-group.entity';
import { DayOfWeek } from '../../../domain/enums/day-of-week.enum';

@Injectable()
export class ScheduleRepository {
  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
  ) {}

  async findById(id: string): Promise<Schedule | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['group', 'group.subject', 'group.cycle', 'group.teacher', 'group.classroom'],
    });
  }

  async findByCycleAndSubject(cycleId: string, subjectId: string): Promise<Schedule[]> {
    return this.repo
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.group', 'group')
      .innerJoinAndSelect('group.subject', 'subject')
      .where('group.cycleId = :cycleId', { cycleId })
      .andWhere('group.subjectId = :subjectId', { subjectId })
      .andWhere('group.isActive = :active', { active: true })
      .getMany();
  }

  async findByCycle(cycleId: string): Promise<Schedule[]> {
    return this.repo
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.group', 'group')
      .innerJoinAndSelect('group.subject', 'subject')
      .innerJoinAndSelect('group.teacher', 'teacher')
      .innerJoinAndSelect('group.classroom', 'classroom')
      .where('group.cycleId = :cycleId', { cycleId })
      .andWhere('group.isActive = :active', { active: true })
      .getMany();
  }

  async findByIdFull(id: string): Promise<Schedule | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['group', 'group.subject', 'group.cycle', 'group.teacher', 'group.classroom'],
    });
  }

  async findWithAvailableSeats(scheduleId: string): Promise<Schedule | null> {
    const schedule = await this.repo.findOne({
      where: { id: scheduleId },
      relations: ['group', 'group.subject', 'group.teacher', 'group.classroom'],
    });
    return schedule;
  }

  async incrementEnrolledCount(id: string): Promise<void> {
    const schedule = await this.repo.findOne({ where: { id }, relations: ['group'] });
    if (schedule?.group) {
      await this.repo.manager.increment(
        SubjectGroup,
        { id: schedule.group.id },
        'enrolledCount',
        1,
      );
    }
  }

  async decrementEnrolledCount(id: string): Promise<void> {
    const schedule = await this.repo.findOne({ where: { id }, relations: ['group'] });
    if (schedule?.group) {
      await this.repo.manager.decrement(
        SubjectGroup,
        { id: schedule.group.id },
        'enrolledCount',
        1,
      );
    }
  }

  async getGroupIdByScheduleId(id: string): Promise<string | null> {
    const schedule = await this.repo.findOne({ where: { id } });
    return schedule?.groupId ?? null;
  }

  async hasTimeConflict(
    studentId: string,
    cycleId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string,
  ): Promise<boolean> {
    const query = this.repo
      .createQueryBuilder('schedule')
      .innerJoin('schedule.enrollmentSubjects', 'es')
      .innerJoin('es.enrollment', 'enrollment')
      .where('enrollment.studentId = :studentId', { studentId })
      .andWhere('enrollment.cycleId = :cycleId', { cycleId })
      .andWhere('enrollment.status = :status', { status: 'active' })
      .andWhere('schedule.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere(
        '(schedule.startTime < :endTime AND schedule.endTime > :startTime)',
        { startTime, endTime },
      );

    if (excludeScheduleId) {
      query.andWhere('schedule.id != :excludeScheduleId', { excludeScheduleId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async findSchedulesByGroup(groupId: string): Promise<Schedule[]> {
    return this.repo.find({ where: { groupId } });
  }

  async create(data: Partial<Schedule>): Promise<Schedule> {
    const schedule = this.repo.create(data);
    return this.repo.save(schedule);
  }

  async update(id: string, data: Partial<Schedule>): Promise<Schedule | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}