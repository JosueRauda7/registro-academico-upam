import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TeacherRepository } from '../../infrastructure/database/repositories/teacher.repository';
import { SubjectGroupRepository } from '../../infrastructure/database/repositories/subject-group.repository';
import { EnrollmentSubjectRepository } from '../../infrastructure/database/repositories/enrollment-subject.repository';
import { GradeRepository } from '../../infrastructure/database/repositories/grade.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { UserRole } from '../../domain/enums/role.enum';
import * as ExcelJS from 'exceljs';

export const PASSING_SCORE = 60;

@Injectable()
export class GradesService {
  constructor(
    private readonly teacherRepository: TeacherRepository,
    private readonly subjectGroupRepository: SubjectGroupRepository,
    private readonly enrollmentSubjectRepository: EnrollmentSubjectRepository,
    private readonly gradeRepository: GradeRepository,
    private readonly studentRepository: StudentRepository,
  ) {}

  async getStudentByUserId(userId: string) {
    const student = await this.studentRepository.findByUserId(userId);
    if (!student) {
      throw new NotFoundException(
        'No se encontro un perfil de estudiante vinculado a esta cuenta',
      );
    }
    return student;
  }

  private async getTeacherByUser(userId: string) {
    const teacher = await this.teacherRepository.findByUserId(userId);
    if (!teacher) {
      throw new NotFoundException(
        'No se encontro un perfil de docente vinculado a esta cuenta',
      );
    }
    return teacher;
  }

  private isCycleEnded(endDate: Date): boolean {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < Date.now();
  }

  private async assertGroupAccess(
    userId: string,
    role: UserRole,
    groupId: string,
  ): Promise<{ group: any; teacherId: string | null }> {
    const group = await this.subjectGroupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    if (role === UserRole.TEACHER) {
      const teacher = await this.getTeacherByUser(userId);
      if (!group.teacherId || group.teacherId !== teacher.id) {
        throw new ForbiddenException(
          'Este grupo no le corresponde al docente autenticado',
        );
      }
      return { group, teacherId: teacher.id };
    }

    return { group, teacherId: null };
  }

  async getTeacherGroups(userId: string) {
    const teacher = await this.getTeacherByUser(userId);
    const groups = await this.subjectGroupRepository.findByTeacher(teacher.id);

    const result: any[] = [];
    for (const group of groups) {
      const roster = await this.enrollmentSubjectRepository.findByGroup(group.id);
      const graded = await this.gradeRepository.findByGroup(group.id);
      result.push({
        id: group.id,
        groupNumber: group.groupNumber,
        subjectId: group.subjectId,
        subjectCode: group.subject?.code,
        subjectName: group.subject?.name,
        credits: group.subject?.credits,
        cycleId: group.cycleId,
        cycleName: group.cycle?.name,
        cycleYear: group.cycle?.year,
        cycleSemester: group.cycle?.semester,
        enrolledCount: roster.length,
        gradedCount: graded.length,
        capacity: group.capacity,
        classroomName: group.classroom?.name,
        cycleEnded: group.cycle ? this.isCycleEnded(group.cycle.endDate) : false,
      });
    }

    return result;
  }

  async getGroupRoster(
    userId: string,
    role: UserRole,
    groupId: string,
  ) {
    const { group } = await this.assertGroupAccess(userId, role, groupId);
    const entries = await this.enrollmentSubjectRepository.findByGroup(groupId);
    const grades = await this.gradeRepository.findByGroup(groupId);
    const gradeMap = new Map(grades.map((g) => [g.enrollmentSubjectId, g]));

    const cycleEnded = group.cycle ? this.isCycleEnded(group.cycle.endDate) : false;

    return {
      group: {
        id: group.id,
        groupNumber: group.groupNumber,
        subjectCode: group.subject?.code,
        subjectName: group.subject?.name,
        credits: group.subject?.credits,
        cycleName: group.cycle?.name,
        cycleEnded,
      },
      students: entries.map((es) => ({
        enrollmentSubjectId: es.id,
        studentCode: es.enrollment?.student?.studentCode,
        carnet: es.enrollment?.student?.carnet,
        studentName: es.enrollment?.student?.user
          ? `${es.enrollment.student.user.firstName} ${es.enrollment.student.user.lastName}`
          : '',
        score: gradeMap.get(es.id)?.score ?? null,
        status: gradeMap.get(es.id)?.status ?? null,
        gradedAt: gradeMap.get(es.id)?.gradedAt ?? null,
      })),
    };
  }

  async saveGrades(
    userId: string,
    groupId: string,
    grades: { enrollmentSubjectId: string; score: number }[],
  ) {
    const { group, teacherId } = await this.assertGroupAccess(
      userId,
      UserRole.TEACHER,
      groupId,
    );

    if (group.cycle && this.isCycleEnded(group.cycle.endDate)) {
      throw new ForbiddenException(
        'El ciclo academico ha finalizado, ya no se pueden modificar las notas',
      );
    }

    if (!Array.isArray(grades) || grades.length === 0) {
      throw new BadRequestException('Debe enviar al menos una calificacion');
    }

    const entries = await this.enrollmentSubjectRepository.findByGroup(groupId);
    const validIds = new Set(entries.map((es) => es.id));

    const saved: any[] = [];
    for (const entry of grades) {
      if (!validIds.has(entry.enrollmentSubjectId)) {
        throw new BadRequestException(
          'Un estudiante del listado no pertenece a este grupo',
        );
      }
      const score = Number(entry.score);
      if (Number.isNaN(score) || score < 0 || score > 100) {
        throw new BadRequestException(
          'La nota debe ser un numero entre 0 y 100',
        );
      }
      const status = score >= PASSING_SCORE ? 'approved' : 'failed';
      await this.gradeRepository.upsert({
        enrollmentSubjectId: entry.enrollmentSubjectId,
        score: Math.round(score * 100) / 100,
        status,
        gradedById: teacherId ?? undefined,
      });
      saved.push({ enrollmentSubjectId: entry.enrollmentSubjectId, score, status });
    }

    return { saved: saved.length };
  }

  async getMyGrades(studentId: string) {
    const grades = await this.gradeRepository.findByStudent(studentId);

    const records = grades.map((grade) => {
      const es = grade.enrollmentSubject;
      return {
        enrollmentSubjectId: es?.id,
        subjectId: es?.subject?.id,
        code: es?.subject?.code,
        name: es?.subject?.name,
        credits: es?.subject?.credits,
        career: es?.subject?.career,
        score: Number(grade.score),
        status: grade.status,
        gradedAt: grade.gradedAt,
        cycleName: es?.enrollment?.cycle?.name,
        cycleYear: es?.enrollment?.cycle?.year,
        cycleSemester: es?.enrollment?.cycle?.semester,
      };
    });

    let cum: number | null = null;
    let approvedCredits = 0;
    let failedCredits = 0;
    const gradedCredits = records.reduce((acc, r) => acc + (r.credits || 0), 0);
    if (gradedCredits > 0) {
      const weighted =
        records.reduce((acc, r) => acc + r.score * (r.credits || 0), 0) /
        gradedCredits;
      cum = Math.round(weighted * 100) / 100;
      records.forEach((r) => {
        if (r.status === 'approved') approvedCredits += r.credits || 0;
        else failedCredits += r.credits || 0;
      });
    }

    return {
      records,
      summary: {
        totalSubjects: records.length,
        approvedSubjects: records.filter((r) => r.status === 'approved').length,
        failedSubjects: records.filter((r) => r.status === 'failed').length,
        approvedCredits,
        failedCredits,
        cum,
      },
    };
  }

  async generateTeacherRosterExcel(role: UserRole, userId: string, groupId: string) {
    const { group } = await this.assertGroupAccess(userId, role, groupId);
    const entries = await this.enrollmentSubjectRepository.findByGroup(groupId);
    const grades = await this.gradeRepository.findByGroup(groupId);
    const gradeMap = new Map(grades.map((g) => [g.enrollmentSubjectId, g]));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Notas del Grupo');

    sheet.columns = [
      { header: 'Carnet', key: 'carnet', width: 15 },
      { header: 'Codigo', key: 'code', width: 18 },
      { header: 'Estudiante', key: 'student', width: 30 },
      { header: 'Materia', key: 'subject', width: 30 },
      { header: 'Nota', key: 'score', width: 10 },
      { header: 'Estado', key: 'status', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1B4F72' },
    };

    for (const es of entries) {
      const grade = gradeMap.get(es.id);
      sheet.addRow({
        carnet: es.enrollment?.student?.carnet || '',
        code: es.enrollment?.student?.studentCode || '',
        student: es.enrollment?.student?.user
          ? `${es.enrollment.student.user.firstName} ${es.enrollment.student.user.lastName}`
          : '',
        subject: es.subject?.name || '',
        score: grade ? Number(grade.score).toFixed(2) : '-',
        status: grade ? (grade.status === 'approved' ? 'Aprobada' : 'Reprobada') : 'Sin nota',
      });
    }

    return workbook.xlsx.writeBuffer();
  }
}