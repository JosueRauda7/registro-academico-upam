import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electronico del usuario',
    example: 'admin@upam.edu.sv',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contrasena del usuario',
    example: 'admin123',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  password: string;
}
