import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../../../domain/enums/role.enum';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string, credentials = false): Promise<User | null> {
    if (credentials) return this.repo.createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.resetToken', 'user.resetTokenExpires'])
      .where('user.id = :id', { id }).getOne();
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string, credentials = false): Promise<User | null> {
    if (credentials) return this.repo.createQueryBuilder('user')
      .addSelect('user.passwordHash').where('user.email = :email', { email }).getOne();
    return this.repo.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async findAll(role?: UserRole): Promise<User[]> {
    if (role) {
      return this.repo.find({ where: { role } });
    }
    return this.repo.find();
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.repo.count({ where: { role } });
  }
}
