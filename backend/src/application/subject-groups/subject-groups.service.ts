import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SubjectGroupRepository } from '../../infrastructure/database/repositories/subject-group.repository';
import { ScheduleRepository } from '../../infrastructure/database/repositories/schedule.repository';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { TeacherRepository } from '../../infrastructure/database/repositories/teacher.repository';
import { ClassroomRepository } from '../../infrastructure/database/repositories/classroom.repository';
import { EnrollmentSubjectRepository } from '../../infrastructure/database/repositories/enrollment-subject.repository';

@Injectable()
export class SubjectGroupsService {
  constructor(
    private readonly subjectGroupRepository: SubjectGroupRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly cycleRepository: CycleRepository,
    private readonly teacherRepository: TeacherRepository,
    private readonly classroomRepository: ClassroomRepository,
    private readonly enrollmentSubjectRepository: EnrollmentSubjectRepository,
  ) {}

  async findAll(cycleId?: string) {
    if (cycleId) {
      return this.subjectGroupRepository.findByCycle(cycleId);
    }
    const all: any[] = [];
    const cycles = await this.cycleRepository.findAll();
    for (const cycle of cycles) {
      const groups = await this.subjectGroupRepository.findByCycle(cycle.id);
      all.push(...groups);
    }
    return all;
  }

  async findById(id: string) {
    const group = await this.subjectGroupRepository.findById(id);
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    return group;
  }

  async create(data: any, schedules?: any[]) {
    const subject = await this.subjectRepository.findById(data.subjectId);
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }
    const cycle = await this.cycleRepository.findById(data.cycleId);
    if (!cycle) {
      throw new NotFoundException('Ciclo no encontrado');
    }

    if (data.teacherId) {
      const teacher = await this.teacherRepository.findById(data.teacherId);
      if (!teacher) throw new NotFoundException('Docente no encontrado');
    }
    const classroom = await this.classroomRepository.findById(data.classroomId);
    if (!classroom) {
      throw new NotFoundException('Salon no encontrado');
    }

    // Check max group_number for this subject+cycle
    const existing = await this.subjectGroupRepository.findByCycle(data.cycleId);
    const sameSubject = existing.filter((g) => g.subjectId === data.subjectId);
    const groupNumber = data.groupNumber || sameSubject.length + 1;

    const dup = sameSubject.find(
      (g) => g.groupNumber === groupNumber && g.isActive,
    );
    if (dup) {
      throw new ConflictException(
        `El grupo ${groupNumber} de esta materia ya existe en el ciclo`,
      );
    }

    if (!data.capacity) {
      data.capacity = classroom.capacity;
    }
    if (data.capacity > classroom.capacity) {
      throw new BadRequestException(
        `La capacidad del grupo no puede exceder la del salon (${classroom.capacity})`,
      );
    }

    const group = await this.subjectGroupRepository.create({
      subjectId: data.subjectId,
      cycleId: data.cycleId,
      teacherId: data.teacherId || null,
      classroomId: data.classroomId,
      groupNumber,
      capacity: data.capacity,
    });

    // Create schedule entries if provided
    if (schedules && schedules.length > 0) {
      for (const sch of schedules) {
        await this.scheduleRepository.create({
          groupId: group.id,
          dayOfWeek: sch.dayOfWeek,
          startTime: sch.startTime,
          endTime: sch.endTime,
        });
      }
    }

    return this.findById(group.id);
  }

  async update(id: string, data: any) {
    const group = await this.findById(id);

    if (data.teacherId && data.teacherId !== group.teacherId) {
      const teacher = await this.teacherRepository.findById(data.teacherId);
      if (!teacher) throw new NotFoundException('Docente no encontrado');
    }

    if (data.classroomId && data.classroomId !== group.classroomId) {
      const classroom = await this.classroomRepository.findById(data.classroomId);
      if (!classroom) throw new NotFoundException('Salon no encontrado');
      const capacity = data.capacity || group.capacity;
      if (capacity > classroom.capacity) {
        throw new BadRequestException(
          `La capacidad del grupo (${
            capacity
          }) excede la capacidad del salon (${classroom.capacity})`,
        );
      }
      // Reassign group to different classroom
      data.classroomId = classroom.id;
    }

    // Capacity validation
    if (data.capacity) {
      const classroom = data.classroomId
        ? await this.classroomRepository.findById(data.classroomId)
        : await this.classroomRepository.findById(group.classroomId);
      if (
        classroom &&
        data.capacity > classroom.capacity
      ) {
        throw new BadRequestException(
          `La capacidad no puede exceder ${classroom.capacity} (capacidad del salon ${classroom.name})`,
        );
      }
      if (data.capacity < group.enrolledCount) {
        throw new BadRequestException(
          `No puede reducir la capacidad por debajo de los estudiantes inscritos (${group.enrolledCount})`,
        );
      }
    }

    return this.subjectGroupRepository.update(id, data);
  }

  async remove(id: string) {
    const group = await this.findById(id);
    if (group.enrolledCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un grupo con estudiantes inscritos',
      );
    }
    await this.subjectGroupRepository.remove(id);
    return { message: 'Grupo eliminado exitosamente' };
  }

  async addSchedule(groupId: string, data: any) {
    await this.findById(groupId);
    return this.scheduleRepository.create({
      groupId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });
  }

  async removeSchedule(scheduleId: string) {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException('Horario no encontrado');
    }
    const count = await this.enrollmentSubjectRepository.checkScheduleInUse(
      scheduleId,
    );
    if (count > 0) {
      throw new BadRequestException(
        'No se puede eliminar un horario con estudiantes inscritos',
      );
    }
    await this.scheduleRepository.remove(scheduleId);
    return { message: 'Horario eliminado exitosamente' };
  }

  async assignTeacher(id: string, teacherId: string) {
    await this.findById(id);
    const teacher = await this.teacherRepository.findById(teacherId);
    if (!teacher) throw new NotFoundException('Docente no encontrado');
    return this.subjectGroupRepository.update(id, { teacherId });
  }

  async changeClassroom(id: string, classroomId: string) {
    const group = await this.findById(id);
    const classroom = await this.classroomRepository.findById(classroomId);
    if (!classroom) throw new NotFoundException('Salon no encontrado');
    if (group.enrolledCount > classroom.capacity) {
      throw new BadRequestException(
        `El salon ${classroom.name} tiene capacidad ${classroom.capacity}, pero el grupo ya tiene ${group.enrolledCount} inscritos`,
      );
    }
    return this.subjectGroupRepository.update(id, { classroomId });
  }
}