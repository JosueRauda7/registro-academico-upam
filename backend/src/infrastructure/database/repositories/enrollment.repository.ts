import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { EnrollmentStatus } from '../../../domain/enums/enrollment-status.enum';

@Injectable()
export class EnrollmentRepository {
  constructor(
    @InjectRepository(Enrollment)
    private readonly repo: Repository<Enrollment>,
  ) {}

  async findById(id: string): Promise<Enrollment | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'cycle', 'subjects', 'subjects.subject', 'subjects.schedule'],
    });
  }

  async findByStudentAndCycle(studentId: string, cycleId: string): Promise<Enrollment | null> {
    return this.repo.findOne({
      where: { studentId, cycleId },
      relations: ['student', 'student.user', 'cycle', 'subjects', 'subjects.subject', 'subjects.schedule'],
    });
  }

  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return this.repo.find({
      where: { studentId },
      relations: ['cycle', 'subjects', 'subjects.subject'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async findActiveByStudentAndCycle(studentId: string, cycleId: string): Promise<Enrollment | null> {
    return this.repo.findOne({
      where: { studentId, cycleId, status: EnrollmentStatus.ACTIVE },
      relations: ['subjects', 'subjects.subject', 'subjects.schedule'],
    });
  }

  async create(data: Partial<Enrollment>): Promise<Enrollment> {
    const enrollment = this.repo.create(data);
    return this.repo.save(enrollment);
  }

  async update(id: string, data: Partial<Enrollment>): Promise<Enrollment | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async findAll(): Promise<Enrollment[]> {
    return this.repo.find({
      relations: ['student', 'student.user', 'cycle', 'subjects', 'subjects.subject', 'subjects.schedule'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async findByCycle(cycleId: string): Promise<Enrollment[]> {
    return this.repo.find({
      where: { cycleId },
      relations: ['student', 'student.user', 'cycle', 'subjects', 'subjects.subject', 'subjects.schedule'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async countByCycle(cycleId: string): Promise<number> {
    return this.repo.count({ where: { cycleId } });
  }
}
