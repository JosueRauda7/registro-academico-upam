import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TeacherRepository } from '../../infrastructure/database/repositories/teacher.repository';

@Injectable()
export class TeachersService {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async findAll(activeOnly = false) {
    return this.teacherRepository.findAll(activeOnly);
  }

  async findById(id: string) {
    const teacher = await this.teacherRepository.findById(id);
    if (!teacher) {
      throw new NotFoundException('Docente no encontrado');
    }
    return teacher;
  }

  async create(data: any) {
    if (data.email) {
      const existing = await this.teacherRepository.findAll();
      const dup = existing.find(
        (t) => t.email?.toLowerCase() === data.email.toLowerCase(),
      );
      if (dup) {
        throw new ConflictException('Ya existe un docente con ese email');
      }
    }
    return this.teacherRepository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.teacherRepository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.teacherRepository.deactivate(id);
  }
}