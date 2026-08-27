import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repo: Repository<StudentEntity>,
  ) {}

  async findById(id: string): Promise<StudentEntity | null> {
    return this.repo.findOne({ where: { id }, relations: ['user'] });
  }

  async findByUserId(userId: string): Promise<StudentEntity | null> {
    return this.repo.findOne({ where: { userId }, relations: ['user'] });
  }

  async findByStudentCode(studentCode: string): Promise<StudentEntity | null> {
    return this.repo.findOne({ where: { studentCode }, relations: ['user'] });
  }

  async create(data: Partial<StudentEntity>): Promise<StudentEntity> {
    const student = this.repo.create(data);
    return this.repo.save(student);
  }

  async update(id: string, data: Partial<StudentEntity>): Promise<StudentEntity | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async findAll(): Promise<StudentEntity[]> {
    return this.repo.find({ relations: ['user'] });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async generateStudentCode(): Promise<string> {
    const count = await this.repo.count();
    const year = new Date().getFullYear();
    const num = String(count + 1).padStart(4, '0');
    return `UPAM-${year}-${num}`;
  }
}
