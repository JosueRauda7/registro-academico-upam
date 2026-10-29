import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electrónico registrado para enviar token de recuperación',
    example: 'admin@upam.edu.sv',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
