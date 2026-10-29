import { IsEmail, IsString, MinLength, Equals, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../domain/enums/role.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Correo electrónico del nuevo usuario',
    example: 'nuevo@upam.edu.sv',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: [UserRole.STUDENT],
    example: UserRole.STUDENT,
    default: UserRole.STUDENT,
  })
  @IsOptional()
  @Equals(UserRole.STUDENT)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Carnet del estudiante (solo para roles de estudiante)',
    example: 'UR2024001',
  })
  @IsOptional()
  @IsString()
  carnet?: string;

  @ApiPropertyOptional({
    description: 'Carrera del estudiante',
    example: 'Ingeniería en Sistemas',
  })
  @IsOptional()
  @IsString()
  career?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '70123456',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Dirección de residencia',
    example: 'San Salvador, El Salvador',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
