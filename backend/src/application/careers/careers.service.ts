import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CareerRepository } from '../../infrastructure/database/repositories/career.repository';
import { SubjectRepository } from '../../infrastructure/database/repositories/subject.repository';

@Injectable()
export class CareersService {
  constructor(
    private readonly careerRepository: CareerRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async findAll(activeOnly = false) {
    return this.careerRepository.findAll(activeOnly);
  }

  async findById(id: string) {
    const career = await this.careerRepository.findById(id);
    if (!career) {
      throw new NotFoundException('Carrera no encontrada');
    }
    return career;
  }

  async create(data: any) {
    this.validateData(data);
    await this.ensureUnique(data.name, data.code);
    return this.careerRepository.create(data);
  }

  async update(id: string, data: any) {
    const career = await this.findById(id);
    const name = data.name ?? career.name;
    const code = data.code ?? career.code;
    if (name !== career.name || code !== career.code) {
      await this.ensureUnique(name, code, id);
    }
    if (data.years !== undefined || data.semestersPerYear !== undefined) {
      const years = data.years ?? career.years;
      const semestersPerYear = data.semestersPerYear ?? career.semestersPerYear;
      if (years < 1 || semestersPerYear < 1) {
        throw new ConflictException('Los anos y semestres deben ser al menos 1');
      }
    }
    return this.careerRepository.update(id, data);
  }

  async remove(id: string) {
    const career = await this.findById(id);
    const activeSubjects = await this.subjectRepository.countActiveByCareer(career.name);
    if (activeSubjects > 0) {
      throw new ConflictException(
        `No se puede desactivar la carrera: tiene ${activeSubjects} materia(s) activa(s) asignada(s)`,
      );
    }
    return this.careerRepository.deactivate(id);
  }

  async reactivate(id: string) {
    await this.findById(id);
    return this.careerRepository.reactivate(id);
  }

  private validateData(data: any) {
    if (!data.name || !String(data.name).trim()) {
      throw new ConflictException('El nombre de la carrera es requerido');
    }
    if (!data.code || !String(data.code).trim()) {
      throw new ConflictException('El codigo de la carrera es requerido');
    }
    if (data.years !== undefined && Number(data.years) < 1) {
      throw new ConflictException('La cantidad de anos debe ser al menos 1');
    }
    if (
      data.semestersPerYear !== undefined &&
      Number(data.semestersPerYear) < 1
    ) {
      throw new ConflictException(
        'La cantidad de semestres por ano debe ser al menos 1',
      );
    }
  }

  private async ensureUnique(name: string, code: string, excludeId?: string) {
    const byName = await this.careerRepository.findByName(name);
    if (byName && byName.id !== excludeId) {
      throw new ConflictException('Ya existe una carrera con ese nombre');
    }
    const byCode = await this.careerRepository.findByCode(code);
    if (byCode && byCode.id !== excludeId) {
      throw new ConflictException('Ya existe una carrera con ese codigo');
    }
  }
}