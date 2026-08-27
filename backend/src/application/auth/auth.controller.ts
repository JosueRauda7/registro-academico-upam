import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario', description: 'Crea una cuenta nueva. Si se registra como estudiante, tambien se crea su perfil de estudiante.' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El correo ya esta registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion', description: 'Autentica al usuario y retorna un token JWT.' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna token JWT y datos del usuario' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperacion de contrasena', description: 'Envia un correo electronico con el token para restablecer la contrasena.' })
  @ApiResponse({ status: 200, description: 'Correo enviado (si el email existe)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contrasena', description: 'Cambia la contrasena usando el token recibido por correo.' })
  @ApiResponse({ status: 200, description: 'Contrasena actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Token invalido o expirado' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }
}
