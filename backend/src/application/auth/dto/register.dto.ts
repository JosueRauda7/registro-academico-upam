import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../domain/enums/role.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Correo electronico del nuevo usuario',
    example: 'nuevo@upam.edu.sv',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contrasena (minimo 8 caracteres)',
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
    example: 'Perez',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: UserRole,
    example: UserRole.STUDENT,
    default: UserRole.STUDENT,
  })
  @IsOptional()
  @IsEnum(UserRole)
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
    example: 'Ingenieria en Sistemas',
  })
  @IsOptional()
  @IsString()
  career?: string;

  @ApiPropertyOptional({
    description: 'Numero de telefono',
    example: '70123456',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Direccion de residencia',
    example: 'San Salvador, El Salvador',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
