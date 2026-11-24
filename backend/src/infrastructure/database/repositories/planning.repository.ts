import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SubjectGroup } from '../entities/subject-group.entity';
import { Schedule } from '../entities/schedule.entity';
import { Cycle } from '../entities/cycle.entity';
import { Teacher } from '../entities/teacher.entity';
import { Classroom } from '../entities/classroom.entity';
import { Subject } from '../entities/subject.entity';
import { EnrollmentSubject } from '../entities/enrollment-subject.entity';

// Every planning write and cycle date/state change takes the same transaction lock.
// This serializes conflict checks and saves, including simultaneous requests.
const PLANNING_LOCK = 471250850;
const groupRelations = ['subject', 'cycle', 'teacher', 'classroom', 'schedules'];
const time = (value: string) => value.length === 5 ? value + ':00' : value;
const overlaps = (a: Pick<Schedule, 'dayOfWeek' | 'startTime' | 'endTime'>, b: Pick<Schedule, 'dayOfWeek' | 'startTime' | 'endTime'>) =>
  a.dayOfWeek === b.dayOfWeek && time(a.startTime) < time(b.endTime) && time(b.startTime) < time(a.endTime);

@Injectable()
export class PlanningRepository {
  constructor(@InjectRepository(SubjectGroup) private readonly repo: Repository<SubjectGroup>) {}

  private async transaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.repo.manager.transaction(async manager => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [PLANNING_LOCK]);
      return work(manager);
    });
  }

  private async group(manager: EntityManager, id: string) {
    const locked = await manager.findOne(SubjectGroup, { where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!locked) throw new NotFoundException('Grupo no encontrado');
    const group = await manager.findOne(SubjectGroup, { where: { id }, relations: groupRelations });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  private async validate(manager: EntityManager, group: SubjectGroup, schedules: Partial<Schedule>[]) {
    const cycle = await manager.findOneBy(Cycle, { id: group.cycleId });
    if (!cycle) throw new NotFoundException('Ciclo no encontrado');
    if (!cycle.isActive) throw new BadRequestException('El ciclo debe estar activo para planificar');
    if (!group.isActive) throw new BadRequestException('El grupo está inactivo');
    // Read locks keep resources from being deactivated while a new assignment is committed.
    const classroom = await manager.findOne(Classroom, { where: { id: group.classroomId }, lock: { mode: 'pessimistic_read' } });
    if (!classroom) throw new NotFoundException('Salón no encontrado');
    if (!classroom.isActive) throw new BadRequestException('El salón está inactivo');
    if (group.teacherId) {
      const teacher = await manager.findOne(Teacher, { where: { id: group.teacherId }, lock: { mode: 'pessimistic_read' } });
      if (!teacher) throw new NotFoundException('Docente no encontrado');
      if (!teacher.isActive) throw new BadRequestException('El docente está inactivo');
    }
    const subject = await manager.findOneBy(Subject, { id: group.subjectId });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    if (!subject.isActive) throw new BadRequestException('La materia está inactiva');
    if (!Number.isInteger(group.capacity) || group.capacity < Math.max(1, group.enrolledCount) || group.capacity > classroom.capacity) {
      throw new BadRequestException('La capacidad debe ser positiva, cubrir a los inscritos y no exceder la del salón');
    }
    for (let i = 0; i < schedules.length; i++) {
      const current = schedules[i] as Schedule;
      if (time(current.startTime) >= time(current.endTime)) throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
      for (const other of schedules.slice(i + 1)) {
        if (overlaps(current, other as Schedule)) throw new ConflictException('Los horarios del mismo grupo se superponen');
      }
    }
    const candidates = await manager.getRepository(Schedule).createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.group', 'group')
      .innerJoin('group.cycle', 'cycle')
      .where('group.isActive = true AND cycle.isActive = true')
      .andWhere('cycle.startDate <= :end AND cycle.endDate >= :start', { start: cycle.startDate, end: cycle.endDate })
      .andWhere('(group.classroomId = :classroom OR group.teacherId = :teacher)', { classroom: group.classroomId, teacher: group.teacherId || null })
      .andWhere('group.id != :id', { id: group.id })
      .getMany();
    for (const schedule of schedules) {
      for (const existing of candidates) {
        if (!overlaps(schedule as Schedule, existing)) continue;
        if (existing.group.classroomId === group.classroomId) throw new ConflictException('El salón ya está ocupado en ese horario');
        throw new ConflictException('El docente ya tiene otra clase en ese horario');
      }
    }
  }

  async saveGroup(id: string | undefined, data: Partial<SubjectGroup>, schedules: Partial<Schedule>[] = []) {
    return this.transaction(async manager => {
      const previous = id ? await this.group(manager, id) : undefined;
      const classroom = await manager.findOneBy(Classroom, { id: data.classroomId ?? previous?.classroomId });
      if (!classroom) throw new NotFoundException('Salón no encontrado');
      const siblings = await manager.findBy(SubjectGroup, { subjectId: data.subjectId ?? previous?.subjectId, cycleId: data.cycleId ?? previous?.cycleId });
      const group = manager.create(SubjectGroup, {
        id: previous?.id,
        subjectId: data.subjectId ?? previous?.subjectId,
        cycleId: data.cycleId ?? previous?.cycleId,
        classroomId: classroom.id,
        teacherId: data.teacherId === undefined ? previous?.teacherId ?? null : data.teacherId,
        groupNumber: previous?.groupNumber ?? data.groupNumber ?? Math.max(0, ...siblings.map(g => g.groupNumber)) + 1,
        capacity: data.capacity ?? previous?.capacity ?? classroom.capacity,
        enrolledCount: previous?.enrolledCount ?? 0,
        isActive: previous?.isActive ?? true,
      });
      // Generate the ID before conflict validation without persisting partial groups.
      if (!group.id) group.id = randomUUID();
      if (siblings.some(g => g.id !== group.id && g.groupNumber === group.groupNumber)) throw new ConflictException('El número de grupo ya existe para esta materia y ciclo');
      await this.validate(manager, group, previous?.schedules ?? schedules);
      await manager.save(SubjectGroup, group);
      if (!previous) {
        for (const schedule of schedules) await manager.save(Schedule, manager.create(Schedule, { ...schedule, groupId: group.id }));
      }
      return this.group(manager, group.id);
    });
  }

  async addSchedule(id: string, data: Partial<Schedule>) {
    return this.transaction(async manager => {
      const group = await this.group(manager, id);
      await this.validate(manager, group, [...group.schedules, data]);
      return manager.save(Schedule, manager.create(Schedule, { ...data, groupId: id }));
    });
  }

  async removeSchedule(groupId: string, scheduleId: string) {
    return this.transaction(async manager => {
      const schedule = await manager.findOne(Schedule, { where: { id: scheduleId, groupId }, lock: { mode: 'pessimistic_write' } });
      if (!schedule) throw new NotFoundException('Horario no encontrado en este grupo');
      if (await manager.countBy(EnrollmentSubject, { scheduleId })) throw new BadRequestException('No se puede eliminar un horario con inscripciones asociadas');
      await manager.delete(Schedule, { id: scheduleId, groupId });
      return { message: 'Horario eliminado exitosamente' };
    });
  }

  async removeGroup(id: string) {
    return this.transaction(async manager => {
      const group = await this.group(manager, id);
      await manager.getRepository(Schedule).createQueryBuilder('schedule').where('schedule.groupId = :id', { id }).setLock('pessimistic_write').getMany();
      const references = await manager.getRepository(EnrollmentSubject).createQueryBuilder('enrollment')
        .innerJoin('enrollment.schedule', 'schedule').where('schedule.groupId = :id', { id }).getCount();
      if (group.enrolledCount > 0 || references > 0) throw new BadRequestException('No se puede eliminar un grupo con inscripciones asociadas');
      await manager.delete(SubjectGroup, { id });
      return { message: 'Grupo eliminado exitosamente' };
    });
  }

  async saveCycle(id: string | undefined, data: Partial<Cycle>) {
    return this.transaction(async manager => {
      const previous = id ? await manager.findOneBy(Cycle, { id }) : undefined;
      if (id && !previous) throw new NotFoundException('Ciclo no encontrado');
      const cycle = manager.create(Cycle, { ...previous, ...data });
      const date = (value: Date | string) => value instanceof Date ? value.toISOString().slice(0, 10) : value;
      if (date(cycle.startDate) >= date(cycle.endDate)) throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
      if (!cycle.isActive) cycle.enrollmentOpen = false;
      if (data.enrollmentOpen === true && !cycle.isActive) throw new BadRequestException('El ciclo debe estar activo para abrir inscripciones');
      if (id && previous && cycle.monthlyCount < previous.monthlyCount) {
        const [result] = await manager.query("SELECT count(*)::int AS count FROM payments WHERE cycle_id=$1 AND month>$2 AND status IN ('completed','pending')", [id, cycle.monthlyCount]);
        if (result.count > 0) throw new BadRequestException('No se pueden quitar mensualidades con pagos completados o pendientes');
      }
      await manager.save(Cycle, cycle);
      // Changing a cycle's calendar or activating it must not introduce new resource conflicts.
      if (id && previous && cycle.isActive && (date(cycle.startDate) !== date(previous.startDate) || date(cycle.endDate) !== date(previous.endDate) || !previous.isActive)) {
        const groups = await manager.find(SubjectGroup, { where: { cycleId: id, isActive: true }, relations: ['schedules'] });
        for (const group of groups) await this.validate(manager, group, group.schedules);
      }
      return cycle;
    });
  }
}
