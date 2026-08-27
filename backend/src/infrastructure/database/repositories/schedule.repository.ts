import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { DayOfWeek } from '../../../domain/enums/day-of-week.enum';

@Injectable()
export class ScheduleRepository {
  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
  ) {}

  async findById(id: string): Promise<Schedule | null> {
    return this.repo.findOne({ where: { id }, relations: ['subject', 'cycle'] });
  }

  async findByCycleAndSubject(cycleId: string, subjectId: string): Promise<Schedule[]> {
    return this.repo.find({ where: { cycleId, subjectId }, relations: ['subject'] });
  }

  async findByCycle(cycleId: string): Promise<Schedule[]> {
    return this.repo.find({ where: { cycleId }, relations: ['subject'] });
  }

  async findWithAvailableSeats(scheduleId: string): Promise<Schedule | null> {
    return this.repo.findOne({ where: { id: scheduleId } });
  }

  async incrementEnrolledCount(id: string): Promise<void> {
    await this.repo.increment({ id }, 'enrolledCount', 1);
  }

  async decrementEnrolledCount(id: string): Promise<void> {
    await this.repo.decrement({ id }, 'enrolledCount', 1);
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

  async create(data: Partial<Schedule>): Promise<Schedule> {
    const schedule = this.repo.create(data);
    return this.repo.save(schedule);
  }

  async update(id: string, data: Partial<Schedule>): Promise<Schedule | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
