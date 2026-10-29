import { ConflictException, Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegacyCompletedSubject } from '../entities/legacy-completed-subject.entity';

const RELATIONS = ['student', 'student.user', 'subject'];

@Injectable()
export class LegacyCompletedSubjectRepository {
  constructor(
    @InjectRepository(LegacyCompletedSubject)
    private readonly repo: Repository<LegacyCompletedSubject>,
  ) {}

  async findByStudent(studentId: string): Promise<LegacyCompletedSubject[]> {
    return this.repo.find({
      where: { studentId },
      relations: RELATIONS,
      order: { year: 'DESC', semester: 'DESC' },
    });
  }

  async findAll(): Promise<LegacyCompletedSubject[]> {
    return this.repo.find({
      relations: RELATIONS,
      order: { year: 'DESC', semester: 'DESC' },
    });
  }

  async findById(id: string): Promise<LegacyCompletedSubject | null> {
    return this.repo.findOne({ where: { id }, relations: RELATIONS });
  }

  async create(data: Partial<LegacyCompletedSubject>): Promise<LegacyCompletedSubject> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async importBatch(rows: Partial<LegacyCompletedSubject>[]): Promise<void> {
    try {
      await this.repo.manager.transaction(async (manager) => {
        await manager.insert(LegacyCompletedSubject, rows);
      });
    } catch (error) {
      // Database uniqueness also protects against concurrent imports/manual registration.
      if (error.code === '23505') throw new ConflictException('Una materia ya fue registrada durante la importación. No se guardó ninguna fila. Actualiza el archivo.');
      if (['23503', '23514', '22003'].includes(error.code)) throw new BadRequestException('Los datos cambiaron o incumplen las restricciones. No se guardó ninguna fila.');
      // Do not log a driver error containing parameters from the uploaded workbook.
      throw new ServiceUnavailableException('No se pudo confirmar la importación. Actualiza los registros antes de reintentar.');
    }
  }

  async update(id: string, data: Partial<LegacyCompletedSubject>): Promise<LegacyCompletedSubject | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
