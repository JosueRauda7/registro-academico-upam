import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { UserRole } from '../../domain/enums/role.enum';

const UPAM_EMAIL_DOMAIN = '@upam.edu.sv';

export interface CreateStudentData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  career?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  enrollmentYear?: number;
}

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
      throw new NotFoundException('No se encontro perfil de estudiante');
    }
    return student;
  }

  private validateEmail(email: string): string {
    const normalized = String(email).trim().toLowerCase();
    if (!normalized.endsWith(UPAM_EMAIL_DOMAIN)) {
      throw new BadRequestException(`El correo debe pertenecer al dominio ${UPAM_EMAIL_DOMAIN}`);
    }
    return normalized;
  }

  private validatePhone(phone?: string): string | undefined {
    if (phone === undefined || phone === null || String(phone).trim() === '') {
      return undefined;
    }
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new BadRequestException('El teléfono debe tener 8 digitos (formato XXXX-XXXX)');
    }
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  private validateDateOfBirth(dob?: string): Date | undefined {
    if (!dob) {
      return undefined;
    }
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Fecha de nacimiento inválida');
    }
    const now = new Date();
    if (date > now) {
      throw new BadRequestException('La fecha de nacimiento no puede ser futura');
    }
    const age = now.getFullYear() - date.getFullYear();
    const hasHadBirthday =
      now.getMonth() > date.getMonth() ||
      (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
    if (age < 18 || (age === 18 && !hasHadBirthday)) {
      throw new BadRequestException('El estudiante debe ser mayor de 18 años');
    }
    return date;
  }

  async create(data: CreateStudentData) {
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new BadRequestException('El correo, la contraseña, el nombre y el apellido son obligatorios');
    }
    if (data.password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    const email = this.validateEmail(data.email);
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico');
    }

    const phone = this.validatePhone(data.phone);
    const dateOfBirth = this.validateDateOfBirth(data.dateOfBirth);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.STUDENT,
    });

    const studentCode = await this.studentRepository.generateStudentCode();
    const carnet = `C${studentCode.split('-').pop()}`;
    const carnetExists = await this.studentRepository.findByCarnet(carnet);
    if (carnetExists) {
      throw new ConflictException('Ya existe un estudiante con este carnet');
    }

    const studentData: any = {
      userId: user.id,
      studentCode,
      carnet,
      career: data.career || 'Ingeniería en Sistemas',
      enrollmentYear: data.enrollmentYear || new Date().getFullYear(),
    };
    if (phone) studentData.phone = phone;
    if (data.address) studentData.address = data.address;
    if (dateOfBirth) studentData.dateOfBirth = dateOfBirth;
    const student = await this.studentRepository.create(studentData);

    return this.studentRepository.findById(student.id);
  }

  async update(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      password?: string;
      career?: string;
      phone?: string;
      address?: string;
      dateOfBirth?: string;
      enrollmentYear?: number;
    },
  ) {
    const student = await this.findById(id);
    const user = student.user;

    const userData: any = {};
    if (data.firstName !== undefined) userData.firstName = data.firstName;
    if (data.lastName !== undefined) userData.lastName = data.lastName;
    if (data.isActive !== undefined) userData.isActive = data.isActive;
    if (data.email !== undefined && data.email !== user.email) {
      const email = this.validateEmail(data.email);
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Ya existe una cuenta con este correo electrónico');
      }
      userData.email = email;
    }
    if (data.password) {
      if (data.password.length < 6) {
        throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
      }
      userData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const studentData: any = {};
    if (data.career !== undefined) studentData.career = data.career;
    if (data.phone !== undefined) studentData.phone = this.validatePhone(data.phone);
    if (data.address !== undefined) studentData.address = data.address;
    if (data.enrollmentYear !== undefined) studentData.enrollmentYear = data.enrollmentYear;
    if (data.dateOfBirth !== undefined) {
      studentData.dateOfBirth = this.validateDateOfBirth(data.dateOfBirth);
    }

    if (Object.keys(userData).length > 0) {
      await this.userRepository.update(user.id, userData);
    }
    if (Object.keys(studentData).length > 0) {
      await this.studentRepository.update(id, studentData);
    }

    return this.findById(id);
  }

  async count() {
    return this.studentRepository.count();
  }
}
