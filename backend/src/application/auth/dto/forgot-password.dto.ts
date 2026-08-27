import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electronico registrado para enviar token de recuperacion',
    example: 'admin@upam.edu.sv',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
