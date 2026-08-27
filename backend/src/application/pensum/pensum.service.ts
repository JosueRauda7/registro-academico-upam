import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { EnrollmentSubjectRepository } from '../../infrastructure/database/repositories/enrollment-subject.repository';
import { CareerRepository } from '../../infrastructure/database/repositories/career.repository';
import { UserRole } from '../../domain/enums/role.enum';
import { EnrollmentStatus, EnrollmentSubjectStatus } from '../../domain/enums/enrollment-status.enum';

interface SubjectHistoryEntry {
  cycleId: string;
  cycleName: string;
  cycleYear: number;
  cycleSemester: number;
  esStatus: string;
  enrollmentStatus: string;
}

@Injectable()
export class PensumService {
  constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly studentRepository: StudentRepository,
    private readonly enrollmentSubjectRepository: EnrollmentSubjectRepository,
    private readonly careerRepository: CareerRepository,
  ) {}

  async getPensum(userId: string, role: UserRole, career?: string) {
    let targetCareer = career;
    let studentInfo: {
      subjectStates: Map<string, { state: string; history: SubjectHistoryEntry[] }>;
    } | null = null;

    if (role === UserRole.STUDENT) {
      const student = await this.studentRepository.findByUserId(userId);
      if (!student) {
        throw new NotFoundException('Estudiante no encontrado');
      }
      targetCareer = student.career;
      studentInfo = { subjectStates: await this.buildSubjectStates(student.id) };
    } else if (!career) {
      throw new BadRequestException('Se requiere el parametro career');
    }

    const careerName = targetCareer!;

    const careerRecord =
      (await this.careerRepository.findByName(careerName)) ??
      (await this.careerRepository.findByCode(careerName));

    const yearsConfig = careerRecord?.years ?? 5;
    const semestersConfig = careerRecord?.semestersPerYear ?? 2;

    const subjects = await this.subjectRepository.findByCareer(careerName);

    if (role === UserRole.STUDENT) {
      const activeOnly = subjects.filter((s) => s.isActive);
      return this.buildStructure(
        careerName,
        careerRecord,
        activeOnly,
        studentInfo!,
        yearsConfig,
        semestersConfig,
      );
    }

    const all = await this.subjectRepository.findAllIncludingInactive();
    const careerSubjects = all.filter((s) => s.career === careerName);
    return this.buildStructure(
      careerName,
      careerRecord,
      careerSubjects,
      null,
      yearsConfig,
      semestersConfig,
    );
  }

  private async buildSubjectStates(studentId: string) {
    const esList = await this.enrollmentSubjectRepository.findByStudentWithCycle(studentId);
    const subjectStates = new Map<string, { state: 'completed' | 'enrolled' | 'pending'; history: SubjectHistoryEntry[] }>();

    const currentYear = new Date().getFullYear();

    for (const es of esList) {
      if (es.status === EnrollmentSubjectStatus.CANCELLED) continue;
      if (es.enrollment?.status === EnrollmentStatus.CANCELLED) continue;

      const entry: SubjectHistoryEntry = {
        cycleId: es.enrollment.cycleId,
        cycleName: es.enrollment.cycle.name,
        cycleYear: es.enrollment.cycle.year,
        cycleSemester: es.enrollment.cycle.semester,
        esStatus: es.status,
        enrollmentStatus: es.enrollment.status,
      };

      let state: 'completed' | 'enrolled' | 'pending';
      if (es.enrollment.status === EnrollmentStatus.ACTIVE) {
        state = 'enrolled';
      } else if (
        es.status === EnrollmentSubjectStatus.CONFIRMED &&
        (es.enrollment.status === EnrollmentStatus.COMPLETED || es.enrollment.cycle.year < currentYear)
      ) {
        state = 'completed';
      } else {
        continue;
      }

      const existing = subjectStates.get(es.subjectId);
      if (!existing) {
        subjectStates.set(es.subjectId, { state, history: [entry] });
      } else {
        existing.history.push(entry);
        if (state === 'enrolled') existing.state = 'enrolled';
      }
    }

    for (const item of subjectStates.values()) {
      item.history.sort((a, b) => b.cycleYear - a.cycleYear || b.cycleSemester - a.cycleSemester);
    }

    return subjectStates;
  }

  private async buildStructure(
    career: string,
    careerRecord: any,
    subjects: any[],
    studentInfo: { subjectStates: Map<string, { state: string; history: SubjectHistoryEntry[] }> } | null,
    yearsConfig: number,
    semestersConfig: number,
  ) {
    const grouped = new Map<number, Map<number, any[]>>();
    const visible = subjects.filter(
      (s) => s.year >= 1 && s.year <= yearsConfig && s.semester >= 1 && s.semester <= semestersConfig,
    );

    for (const subject of visible) {
      if (!grouped.has(subject.year)) grouped.set(subject.year, new Map());
      const semesters = grouped.get(subject.year)!;
      if (!semesters.has(subject.semester)) semesters.set(subject.semester, []);
      semesters.get(subject.semester)!.push(subject);
    }

    const years: any[] = [];
    for (let y = 1; y <= yearsConfig; y++) {
      const semesters: any[] = [];
      for (let s = 1; s <= semestersConfig; s++) {
        const items = (grouped.get(y)?.get(s) ?? []).sort((a, b) => a.code.localeCompare(b.code));
        const subjectsOut = items.map((subj) => {
          const base = {
            id: subj.id,
            code: subj.code,
            name: subj.name,
            credits: subj.credits,
            career: subj.career,
            year: subj.year,
            semester: subj.semester,
            isActive: subj.isActive,
          };
          if (studentInfo) {
            const info = studentInfo.subjectStates.get(subj.id);
            base['state'] = info?.state || 'pending';
            base['history'] = info?.history || [];
          }
          return base;
        });
        semesters.push({ semester: s, subjects: subjectsOut });
      }
      years.push({ year: y, semesters });
    }

    let totalCredits = 0;
    for (const s of visible) {
      totalCredits += Number(s.credits) || 0;
    }

    const result: any = {
      career,
      totalSubjects: visible.length,
      totalCredits,
      years,
      careerConfig: careerRecord
        ? {
            id: careerRecord.id,
            code: careerRecord.code,
            name: careerRecord.name,
            years: careerRecord.years,
            semestersPerYear: careerRecord.semestersPerYear,
            isActive: careerRecord.isActive,
          }
        : null,
    };

    if (studentInfo) {
      let completedCredits = 0;
      let enrolledCredits = 0;
      let pendingCredits = 0;
      let completedSubjects = 0;
      let enrolledSubjects = 0;
      let pendingSubjects = 0;
      for (const s of visible) {
        const info = studentInfo.subjectStates.get(s.id);
        const state = info?.state || 'pending';
        const credits = Number(s.credits) || 0;
        if (state === 'completed') {
          completedCredits += credits;
          completedSubjects++;
        } else if (state === 'enrolled') {
          enrolledCredits += credits;
          enrolledSubjects++;
        } else {
          pendingCredits += credits;
          pendingSubjects++;
        }
      }
      result.student = {
        completedSubjects,
        enrolledSubjects,
        pendingSubjects,
        completedCredits,
        enrolledCredits,
        pendingCredits,
      };
    }

    return result;
  }
}