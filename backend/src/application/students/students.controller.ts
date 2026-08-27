import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
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

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar estudiante', description: 'Solo administradores pueden actualizar datos de un estudiante.' })
  @ApiParam({ name: 'id', description: 'UUID del estudiante' })
  @ApiResponse({ status: 200, description: 'Estudiante actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.update(id, body);
  }
}
