import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { Prerequisite } from '../entities/prerequisite.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class SubjectRepository {
  constructor(
    @InjectRepository(Subject)
    private readonly repo: Repository<Subject>,
  ) {}

  async findById(id: string): Promise<Subject | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
    });
  }

  async findByCode(code: string): Promise<Subject | null> {
    return this.repo.findOne({ where: { code } });
  }

  async findByCareer(career: string): Promise<Subject[]> {
    return this.repo.find({
      where: { career, isActive: true },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
      order: { year: 'ASC', semester: 'ASC' },
    });
  }

  async findAll(): Promise<Subject[]> {
    return this.repo.find({
      where: { isActive: true },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
      order: { year: 'ASC', semester: 'ASC', code: 'ASC' },
    });
  }

  async findAllIncludingInactive(): Promise<Subject[]> {
    return this.repo.find({
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
      order: { year: 'ASC', semester: 'ASC', code: 'ASC' },
    });
  }

  async countActiveByCareer(career: string): Promise<number> {
    return this.repo.count({ where: { career, isActive: true } });
  }

  async create(data: Partial<Subject>): Promise<Subject> {
    const subject = this.repo.create(data);
    return this.repo.save(subject);
  }

  async saveWithPrerequisites(id: string | undefined, data: Partial<Subject>, ids?: string[]): Promise<Subject> {
    try {
      return await this.repo.manager.transaction(async manager => {
        // All graph edits serialize, preventing concurrent A->B and B->A cycles.
        await manager.query('SELECT pg_advisory_xact_lock($1)', [471250849]);
        const subjects = manager.getRepository(Subject);
        const prerequisites = manager.getRepository(Prerequisite);
        const current = id ? await subjects.findOneBy({ id }) : null;
        if (id && !current) throw new NotFoundException('Materia no encontrada');
        const subjectId = id ?? randomUUID();
        const career = data.career ?? current!.career;
        const edges = await prerequisites.find();
        const previous = new Set(edges.filter(edge => edge.subjectId === subjectId).map(edge => edge.prerequisiteSubjectId));
        const requested = ids ?? edges.filter(edge => edge.subjectId === subjectId).map(edge => edge.prerequisiteSubjectId);
        if (requested.length > 100 || new Set(requested).size !== requested.length) throw new BadRequestException('Prerrequisitos repetidos o más de 100 materias.');
        if (requested.includes(subjectId)) throw new BadRequestException('Una materia no puede ser su propio prerrequisito.');
        const all = await subjects.find();
        const byId = new Map(all.map(subject => [subject.id, subject]));
        for (const prerequisiteId of requested) {
          const prerequisite = byId.get(prerequisiteId);
          if (!prerequisite || prerequisite.career !== career || (ids !== undefined && !prerequisite.isActive && !previous.has(prerequisiteId))) throw new BadRequestException('Cada prerrequisito debe existir y pertenecer a la misma carrera; los nuevos deben estar activos.');
        }
        if (edges.some(edge => edge.prerequisiteSubjectId === subjectId && byId.get(edge.subjectId)?.career !== career)) throw new BadRequestException('No se puede cambiar la carrera mientras otras materias de otra carrera dependan de esta.');
        const graph = new Map<string, string[]>();
        for (const edge of edges) {
          if (edge.subjectId !== subjectId) graph.set(edge.subjectId, [...(graph.get(edge.subjectId) ?? []), edge.prerequisiteSubjectId]);
        }
        const stack = [...requested]; const visited = new Set<string>();
        while (stack.length) {
          const node = stack.pop()!;
          if (node === subjectId) throw new BadRequestException('Los prerrequisitos no pueden formar ciclos entre materias.');
          if (visited.has(node)) continue;
          visited.add(node); stack.push(...(graph.get(node) ?? []));
        }
        const saved = await subjects.save(subjects.create({ ...current, ...data, id: subjectId }));
        if (ids !== undefined) {
          await prerequisites.delete({ subjectId });
          if (ids.length) await prerequisites.insert(ids.map(prerequisiteSubjectId => ({ subjectId, prerequisiteSubjectId })));
        }
        return saved;
      });
    } catch (error) {
      if (error.code === '23505') throw new ConflictException('Ya existe una materia con ese código o un prerrequisito repetido.');
      if (error.code === '23503') throw new BadRequestException('Una materia fue modificada durante el guardado. Reintenta.');
      throw error;
    }
  }

  async update(id: string, data: Partial<Subject>): Promise<Subject | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<Subject | null> {
    await this.repo.update(id, { isActive: false });
    return this.findById(id);
  }

  async findPrerequisites(subjectId: string): Promise<Subject[]> {
    const subject = await this.repo.findOne({
      where: { id: subjectId },
      relations: ['prerequisites', 'prerequisites.prerequisiteSubject'],
    });
    if (!subject) return [];
    return subject.prerequisites.map((p) => p.prerequisiteSubject);
  }
}
