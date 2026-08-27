import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { StudentRepository } from '../../infrastructure/database/repositories/student.repository';
import { EmailService } from '../../infrastructure/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly studentRepository: StudentRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role || UserRole.STUDENT;

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
    });

    if (role === UserRole.STUDENT) {
      const studentCode = await this.studentRepository.generateStudentCode();
      await this.studentRepository.create({
        userId: user.id,
        studentCode,
        carnet: dto.carnet || `C${studentCode.split('-').pop()}`,
        career: dto.career || 'Ingenieria en Sistemas',
        enrollmentYear: new Date().getFullYear(),
        phone: dto.phone,
        address: dto.address,
      });
    }

    const token = await this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada. Contacte al administrador.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = await this.generateToken(user);

    let studentData: any = null;
    if (user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findByUserId(user.id);
      if (student) {
        studentData = {
          id: student.id,
          studentCode: student.studentCode,
          carnet: student.carnet,
          career: student.career,
        };
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      student: studentData,
      token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'Si el correo existe, se ha enviado un enlace de recuperación' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'password-reset' },
      { expiresIn: '1h' },
    );

    await this.userRepository.update(user.id, {
      resetToken,
      resetTokenExpires: new Date(Date.now() + 3600000),
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Si el correo existe, se ha enviado un enlace de recuperación' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findById(
      this.jwtService.verify(dto.token).sub,
    );

    if (!user || user.resetToken !== dto.token) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let studentData: any = null;
    if (user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findByUserId(user.id);
      if (student) {
        studentData = {
          id: student.id,
          studentCode: student.studentCode,
          carnet: student.carnet,
          career: student.career,
          phone: student.phone,
          address: student.address,
          dateOfBirth: student.dateOfBirth,
          enrollmentYear: student.enrollmentYear,
        };
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      student: studentData,
    };
  }

  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }
}
