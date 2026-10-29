import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { TeacherRepository } from '../../infrastructure/database/repositories/teacher.repository';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly studentRepository: StudentRepository,
    private readonly teacherRepository: TeacherRepository,
  ) {}

  async findAll(role?: UserRole) {
    const users = await this.userRepository.findAll(role);
    return users.map((u) => this.sanitize(u));
  }

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.sanitize(user);
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    career?: string;
    carnet?: string;
  }) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico');
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });

    if (data.role === UserRole.STUDENT) {
      const studentCode = await this.studentRepository.generateStudentCode();
      await this.studentRepository.create({
        userId: user.id,
        studentCode,
        carnet: data.carnet || `C${studentCode.split('-').pop()}`,
        career: data.career || 'Ingeniería en Sistemas',
        enrollmentYear: new Date().getFullYear(),
      });
    }

    if (data.role === UserRole.TEACHER) {
      await this.teacherRepository.create({
        userId: user.id,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
      });
    }

    return this.sanitize(user);
  }

  async update(
    id: string,
    data: { firstName?: string; lastName?: string; role?: UserRole; isActive?: boolean; password?: string },
  ) {
    const user = await this.findById(id);

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      if (data.password.length < 6) {
        throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
      }
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (user.role === UserRole.ADMINISTRATOR && data.isActive === false) {
      throw new BadRequestException('No puede desactivar una cuenta de administrador');
    }

    const updated = await this.userRepository.update(id, updateData);

    if (updated && updated.role === UserRole.TEACHER) {
      const profile = await this.teacherRepository.findByUserId(updated.id);
      if (!profile) {
        await this.teacherRepository.create({
          userId: updated.id,
          name: `${updated.firstName} ${updated.lastName}`.trim(),
          email: updated.email,
        });
      }
    }

    return this.sanitize(updated);
  }

  async remove(id: string) {
    await this.findById(id);
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.role === UserRole.ADMINISTRATOR) {
      throw new BadRequestException('No puede desactivar una cuenta de administrador');
    }
    return this.sanitize(await this.userRepository.update(id, { isActive: false }));
  }

  private sanitize(user: any) {
    const { passwordHash, resetToken, resetTokenExpires, ...rest } = user;
    return rest;
  }
}