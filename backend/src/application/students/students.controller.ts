import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth('jwt-auth')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Listar todos los estudiantes', description: 'Retorna la lista de todos los estudiantes registrados (solo administradores, administrativos y colectores).' })
  @ApiResponse({ status: 200, description: 'Lista de estudiantes' })
  findAll() {
    return this.studentsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Mi perfil de estudiante', description: 'Retorna los datos del perfil de estudiante del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Datos del estudiante' })
  @ApiResponse({ status: 404, description: 'No se encontro perfil de estudiante' })
  getMe(@CurrentUser('sub') userId: string) {
    return this.studentsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener estudiante por ID' })
  @ApiParam({ name: 'id', description: 'UUID del estudiante' })
  @ApiResponse({ status: 200, description: 'Estudiante encontrado' })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  findById(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear estudiante', description: 'Crea la cuenta de usuario y el perfil academico de un estudiante. Solo administradores y administrativos.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string', example: 'estudiante2@upam.edu.sv' },
        password: { type: 'string', example: 'segura123' },
        firstName: { type: 'string', example: 'Maria' },
        lastName: { type: 'string', example: 'Lopez' },
        career: { type: 'string', example: 'Ingenieria en Sistemas' },
        phone: { type: 'string', example: '7000-0000' },
        address: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        enrollmentYear: { type: 'number', example: 2026 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Estudiante creado' })
  @ApiResponse({ status: 409, description: 'Correo ya registrado' })
  create(@Body() body: any) {
    return this.studentsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Actualizar estudiante', description: 'Actualiza datos de la cuenta y del perfil academico de un estudiante (incluye activar/desactivar). Solo administradores y administrativos.' })
  @ApiParam({ name: 'id', description: 'UUID del estudiante' })
  @ApiResponse({ status: 200, description: 'Estudiante actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador o administrativo' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.update(id, body);
  }
}
