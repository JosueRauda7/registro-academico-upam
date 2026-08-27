import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperacion de contrasena',
    example: 'abc123def456',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Nueva contrasena (minimo 8 caracteres)',
    example: 'NuevaPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
