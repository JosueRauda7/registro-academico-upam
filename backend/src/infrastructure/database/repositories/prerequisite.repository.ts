import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prerequisite } from '../entities/prerequisite.entity';

@Injectable()
export class PrerequisiteRepository {
  constructor(
    @InjectRepository(Prerequisite)
    private readonly repo: Repository<Prerequisite>,
  ) {}

  async findBySubject(subjectId: string): Promise<Prerequisite[]> {
    return this.repo.find({
      where: { subjectId },
      relations: ['prerequisiteSubject'],
    });
  }

  async addPrerequisite(
    subjectId: string,
    prerequisiteSubjectId: string,
  ): Promise<Prerequisite> {
    const entity = this.repo.create({ subjectId, prerequisiteSubjectId });
    return this.repo.save(entity);
  }

  async removeAllForSubject(subjectId: string): Promise<void> {
    await this.repo.delete({ subjectId });
  }
}
