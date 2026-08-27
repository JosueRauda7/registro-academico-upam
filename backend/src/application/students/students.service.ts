import { Injectable, NotFoundException } from '@nestjs/common';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async findAll() {
    return this.studentRepository.findAll();
  }

  async findById(id: string) {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return student;
  }

  async findByUserId(userId: string) {
    const student = await this.studentRepository.findByUserId(userId);
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return student;
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.studentRepository.update(id, data);
  }

  async count() {
    return this.studentRepository.count();
  }
}
