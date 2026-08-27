import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LegacyCompletedSubjectRepository } from '../../infrastructure/database/repositories/legacy-completed-subject.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';

export const PASSING_SCORE = 60;

@Injectable()
export class LegacySubjectsService {
  constructor(
    private readonly legacyRepository: LegacyCompletedSubjectRepository,
    private readonly studentRepository: StudentRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async findAll(studentId?: string) {
    let records: any[];
    if (studentId) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        throw new NotFoundException('Estudiante no encontrado');
      }
      records = await this.legacyRepository.findByStudent(studentId);
    } else {
      records = await this.legacyRepository.findAll();
    }

    return records.map((r) => ({
      id: r.id,
      student: r.student
        ? {
            id: r.student.id,
            carnet: r.student.carnet,
            studentCode: r.student.studentCode,
            career: r.student.career,
            name: r.student.user
              ? `${r.student.user.firstName} ${r.student.user.lastName}`
              : '',
          }
        : null,
      code: r.subject?.code,
      subjectName: r.subject?.name,
      credits: r.subject?.credits,
      year: Number(r.year) || null,
      semester: Number(r.semester) || null,
      score: Number(r.score),
      status: Number(r.score) >= PASSING_SCORE ? 'approved' : 'failed',
      notes: r.notes,
      createdAt: r.createdAt,
    }));
  }

  async register(
    data: {
      studentId: string;
      subjectId: string;
      score: number;
      year?: number | null;
      semester?: number | null;
      notes?: string | null;
    },
    registeredById?: string,
  ) {
    const student = await this.studentRepository.findById(data.studentId);
    if (!student) {
      throw new BadRequestException('El estudiante no existe');
    }

    const subject = await this.subjectRepository.findById(data.subjectId);
    if (!subject) {
      throw new BadRequestException('La materia no existe');
    }

    const score = Number(data.score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      throw new BadRequestException('La nota debe ser un numero entre 0 y 100');
    }

    const existing = await this.legacyRepository.findByStudent(data.studentId);
    if (existing.some((r) => r.subjectId === data.subjectId)) {
      throw new BadRequestException(
        'La materia ya fue registrada para este estudiante',
      );
    }

    const record = await this.legacyRepository.create({
      studentId: data.studentId,
      subjectId: data.subjectId,
      score: Math.round(score * 100) / 100,
      year: data.year ? Number(data.year) : null,
      semester: data.semester ? Number(data.semester) : null,
      notes: data.notes || null,
      registeredById,
    });

    return this.toDto(record);
  }

  async update(
    id: string,
    data: {
      score?: number;
      year?: number | null;
      semester?: number | null;
      notes?: string | null;
    },
  ) {
    const record = await this.legacyRepository.findById(id);
    if (!record) {
      throw new NotFoundException('Registro no encontrado');
    }

    if (data.score !== undefined) {
      const score = Number(data.score);
      if (Number.isNaN(score) || score < 0 || score > 100) {
        throw new BadRequestException('La nota debe ser un numero entre 0 y 100');
      }
      record.score = Math.round(score * 100) / 100;
    }
    if (data.year !== undefined) record.year = data.year ? Number(data.year) : null;
    if (data.semester !== undefined) record.semester = data.semester ? Number(data.semester) : null;
    if (data.notes !== undefined) record.notes = data.notes || null;

    const updated = await this.legacyRepository.update(id, {
      score: record.score,
      year: record.year,
      semester: record.semester,
      notes: record.notes,
    });

    return this.toDto(updated!);
  }

  async remove(id: string) {
    const record = await this.legacyRepository.findById(id);
    if (!record) {
      throw new NotFoundException('Registro no encontrado');
    }
    await this.legacyRepository.remove(id);
    return { deleted: true };
  }

  private toDto(r: any) {
    return {
      id: r.id,
      student: r.student
        ? {
            id: r.student.id,
            carnet: r.student.carnet,
            studentCode: r.student.studentCode,
            career: r.student.career,
            name: r.student.user
              ? `${r.student.user.firstName} ${r.student.user.lastName}`
              : '',
          }
        : null,
      code: r.subject?.code,
      subjectName: r.subject?.name,
      credits: r.subject?.credits,
      year: Number(r.year) || null,
      semester: Number(r.semester) || null,
      score: Number(r.score),
      status: Number(r.score) >= PASSING_SCORE ? 'approved' : 'failed',
      notes: r.notes,
      createdAt: r.createdAt,
    };
  }
}
