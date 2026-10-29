import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EnrollmentRepository } from '../../infrastructure/database/repositories/enrollment.repository';
import { EnrollmentSubjectRepository } from '../../infrastructure/database/repositories/enrollment-subject.repository';
import { ScheduleRepository } from '../../infrastructure/database/repositories/schedule.repository';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';
import { PaymentRepository } from '../../infrastructure/database/repositories/payment.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { CycleRepository } from '../../infrastructure/database/repositories/cycle.repository';
import { LegacyCompletedSubjectRepository } from '../../infrastructure/database/repositories/legacy-completed-subject.repository';
import { EmailService } from '../../infrastructure/email/email.service';
import { EnrollmentStatus, EnrollmentSubjectStatus } from '../../domain/enums/enrollment-status.enum';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly enrollmentSubjectRepository: EnrollmentSubjectRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly studentRepository: StudentRepository,
    private readonly cycleRepository: CycleRepository,
    private readonly legacyRepository: LegacyCompletedSubjectRepository,
    private readonly emailService: EmailService,
  ) {}

  private async hasLegacyCompleted(studentId: string, subjectId: string): Promise<boolean> {
    const legacy = await this.legacyRepository.findByStudent(studentId);
    return legacy.some((r) => r.subjectId === subjectId && Number(r.score) >= 6);
  }

  private async resolveStudentId(userId: string): Promise<string> {
    const student = await this.studentRepository.findByUserId(userId);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return student.id;
  }

  async getEnrollment(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    const enrollment = await this.enrollmentRepository.findByStudentAndCycle(studentId, cycleId);
    if (!enrollment) {
      throw new NotFoundException('Inscripción no encontrada para este ciclo');
    }
    return enrollment;
  }

  async getMyEnrollments(userId: string) {
    const studentId = await this.resolveStudentId(userId);
    return this.enrollmentRepository.findByStudent(studentId);
  }

  async enrollInCycle(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    // Verify cycle is open
    const cycle = await this.cycleRepository.findById(cycleId);
    if (!cycle || !cycle.enrollmentOpen) {
      throw new BadRequestException('El ciclo no está abierto para inscripción');
    }

    // Verify tuition is paid
    const hasPaid = await this.paymentRepository.hasTuitionPayment(studentId, cycleId);
    if (!hasPaid) {
      throw new BadRequestException('Debe pagar la matrícula del ciclo antes de inscribir materias');
    }

    // Check if already enrolled
    const existingEnrollment = await this.enrollmentRepository.findByStudentAndCycle(studentId, cycleId);
    if (existingEnrollment) {
      throw new ConflictException('Ya está inscrito en este ciclo');
    }

    const enrollment = await this.enrollmentRepository.create({
      studentId,
      cycleId,
      status: EnrollmentStatus.ACTIVE,
      tuitionPaid: true,
    });

    return enrollment;
  }

  async enrollSubject(userId: string, cycleId: string, subjectId: string, scheduleId: string) {
    const studentId = await this.resolveStudentId(userId);

    // Get or create enrollment for this cycle
    let enrollment = await this.enrollmentRepository.findActiveByStudentAndCycle(studentId, cycleId);

    if (!enrollment) {
      // Auto-enroll in cycle if tuition paid
      const hasPaid = await this.paymentRepository.hasTuitionPayment(studentId, cycleId);
      if (!hasPaid) {
        throw new BadRequestException('Debe pagar la matrícula del ciclo antes de inscribir materias');
      }

      enrollment = await this.enrollmentRepository.create({
        studentId,
        cycleId,
        status: EnrollmentStatus.ACTIVE,
        tuitionPaid: true,
      });
    }

    // Verify subject exists
    const subject = await this.subjectRepository.findById(subjectId);
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Verify prerequisites (regular grade approved OR legacy completed >= passing)
    const prerequisites = await this.subjectRepository.findPrerequisites(subjectId);
    for (const prereq of prerequisites) {
      const completed =
        (await this.enrollmentSubjectRepository.hasCompletedSubject(studentId, prereq.id)) ||
        (await this.hasLegacyCompleted(studentId, prereq.id));
      if (!completed) {
        throw new BadRequestException(
          `No cumple con el requisito previo: ${prereq.name} (${prereq.code})`,
        );
      }
    }

    // Check if already enrolled in this subject
    const existingEnrollment = await this.enrollmentSubjectRepository.findByEnrollmentAndSubject(
      enrollment.id,
      subjectId,
    );
    if (existingEnrollment && existingEnrollment.status !== EnrollmentSubjectStatus.CANCELLED) {
      throw new ConflictException('Ya está inscrito en esta materia');
    }

    // Verify schedule and available seats
    const schedule = await this.scheduleRepository.findWithAvailableSeats(scheduleId);
    if (!schedule) {
      throw new NotFoundException('Horario no encontrado');
    }

    const group = schedule.group;
    if (!group) {
      throw new NotFoundException('Grupo no encontrado para este horario');
    }

    if (group.enrolledCount >= group.capacity) {
      throw new BadRequestException('No hay cupos disponibles en este grupo');
    }

    // Check schedule conflicts
    const hasConflict = await this.scheduleRepository.hasTimeConflict(
      studentId,
      cycleId,
      schedule.dayOfWeek,
      schedule.startTime,
      schedule.endTime,
    );
    if (hasConflict) {
      throw new BadRequestException(
        `Conflicto de horario: ya tiene una materia programada el ${schedule.dayOfWeek} de ${schedule.startTime} a ${schedule.endTime}`,
      );
    }

    // Reserve seat in group
    await this.scheduleRepository.incrementEnrolledCount(scheduleId);

    // Create enrollment subject
    const enrollmentSubject = await this.enrollmentSubjectRepository.create({
      enrollmentId: enrollment.id,
      subjectId,
      scheduleId,
      status: EnrollmentSubjectStatus.RESERVED,
    });

    return {
      enrollmentSubject,
      message: `Materia ${subject.name} reservada exitosamente. Grupo ${group.groupNumber}: ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime} en ${group.classroom?.name}`,
    };
  }

  async cancelSubject(userId: string, enrollmentSubjectId: string) {
    const enrollmentSubject = await this.enrollmentSubjectRepository.findById(enrollmentSubjectId);
    if (!enrollmentSubject) {
      throw new NotFoundException('Inscripción de materia no encontrada');
    }

    // Verify ownership
    const studentId = await this.resolveStudentId(userId);
    const enrollment = await this.enrollmentRepository.findById(enrollmentSubject.enrollmentId);
    if (!enrollment || enrollment.studentId !== studentId) {
      throw new BadRequestException('No tiene permiso para cancelar esta inscripción');
    }

    if (enrollmentSubject.status === EnrollmentSubjectStatus.CANCELLED) {
      throw new BadRequestException('La materia ya está cancelada');
    }

    // Release seat
    await this.scheduleRepository.decrementEnrolledCount(enrollmentSubject.scheduleId);

    // Cancel
    await this.enrollmentSubjectRepository.update(enrollmentSubjectId, {
      status: EnrollmentSubjectStatus.CANCELLED,
    });

    return { message: 'Materia cancelada exitosamente' };
  }

  async confirmEnrollment(userId: string, cycleId: string) {
    const studentId = await this.resolveStudentId(userId);
    const enrollment = await this.enrollmentRepository.findActiveByStudentAndCycle(studentId, cycleId);
    if (!enrollment) {
      throw new NotFoundException('Inscripción activa no encontrada');
    }

    if (enrollment.subjects.length === 0) {
      throw new BadRequestException('Debe inscribir al menos una materia para confirmar');
    }

    // Confirm all reserved subjects
    for (const es of enrollment.subjects) {
      if (es.status === EnrollmentSubjectStatus.RESERVED) {
        await this.enrollmentSubjectRepository.update(es.id, {
          status: EnrollmentSubjectStatus.CONFIRMED,
        });
      }
    }

    const student = await this.studentRepository.findById(studentId);
    const cycle = await this.cycleRepository.findById(cycleId);

    if (student && cycle) {
      await this.emailService.sendEnrollmentConfirmation(student.user.email, {
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        cycleName: cycle.name,
        subjects: enrollment.subjects.map((es) => es.subject.name),
        totalCredits: enrollment.subjects.reduce((sum, es) => sum + es.subject.credits, 0),
      });
    }

    return { message: 'Inscripción confirmada exitosamente' };
  }

  async getAllEnrollments(cycleId?: string) {
    if (cycleId) {
      return this.enrollmentRepository.findByCycle(cycleId);
    }
    return this.enrollmentRepository.findAll();
  }

  async getEnrollmentStats(cycleId: string) {
    const totalEnrolled = await this.enrollmentRepository.countByCycle(cycleId);
    return { totalEnrolled };
  }
}
