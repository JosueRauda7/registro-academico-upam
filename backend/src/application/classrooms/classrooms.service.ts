import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ClassroomRepository } from '../../infrastructure/database/repositories/classroom.repository';

@Injectable()
export class ClassroomsService {
  constructor(
    private readonly classroomRepository: ClassroomRepository,
  ) {}

  async findAll(activeOnly = false) {
    return this.classroomRepository.findAll(activeOnly);
  }

  async findById(id: string) {
    const classroom = await this.classroomRepository.findById(id);
    if (!classroom) {
      throw new NotFoundException('Salón no encontrado');
    }
    return classroom;
  }

  async create(data: any) {
    if (!data.capacity || data.capacity < 1) {
      throw new ConflictException('La capacidad debe ser al menos 1');
    }
    return this.classroomRepository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    if (data.capacity && data.capacity < 1) {
      throw new ConflictException('La capacidad debe ser al menos 1');
    }
    return this.classroomRepository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.classroomRepository.deactivate(id);
  }
}