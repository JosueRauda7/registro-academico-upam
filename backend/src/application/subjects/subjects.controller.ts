import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Subjects')
@ApiBearerAuth('jwt-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar materias', description: 'Retorna todas las materias, opcionalmente filtradas por carrera. Con all=true retorna tambien las inactivas.' })
  @ApiQuery({ name: 'career', required: false, description: 'Filtrar por carrera', example: 'Ingenieria en Sistemas' })
  @ApiQuery({ name: 'all', required: false, description: 'Incluir materias inactivas', example: 'true' })
  @ApiResponse({ status: 200, description: 'Lista de materias' })
  findAll(@Query('career') career?: string, @Query('all') all?: string) {
    return this.subjectsService.findAll(career, all === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener materia por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la materia' })
  @ApiResponse({ status: 200, description: 'Materia encontrada' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  findById(@Param('id') id: string) {
    return this.subjectsService.findById(id);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Obtener horarios de una materia', description: 'Retorna los horarios disponibles para una materia en un ciclo especifico.' })
  @ApiParam({ name: 'id', description: 'UUID de la materia' })
  @ApiQuery({ name: 'cycleId', required: true, description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Horarios disponibles' })
  findSchedules(@Param('id') id: string, @Query('cycleId') cycleId: string) {
    return this.subjectsService.findSchedules(id, cycleId);
  }

  @Get(':id/prerequisites')
  @ApiOperation({ summary: 'Obtener prerequisitos de una materia', description: 'Retorna las materias que son prerequisito para esta materia.' })
  @ApiParam({ name: 'id', description: 'UUID de la materia' })
  @ApiResponse({ status: 200, description: 'Lista de prerequisitos' })
  getPrerequisites(@Param('id') id: string) {
    return this.subjectsService.getPrerequisites(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear materia', description: 'Administradores y administrativos pueden crear materias.' })
  @ApiResponse({ status: 201, description: 'Materia creada exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  create(@Body() body: any) {
    return this.subjectsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Actualizar materia' })
  @ApiParam({ name: 'id', description: 'UUID de la materia' })
  @ApiResponse({ status: 200, description: 'Materia actualizada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.subjectsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Desactivar materia', description: 'Desactiva (eliminacion logica) una materia. No se eliminan inscripciones existentes.' })
  @ApiParam({ name: 'id', description: 'UUID de la materia' })
  @ApiResponse({ status: 200, description: 'Materia desactivada' })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }

  @Post('schedules')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear horario para una materia', description: 'Asigna un horario (dia, hora, aula, cupo) a una materia en un ciclo.' })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'La materia o ciclo no existen' })
  createSchedule(@Body() body: any) {
    return this.subjectsService.createSchedule(body);
  }

  @Get('schedules/cycle/:cycleId')
  @ApiOperation({ summary: 'Obtener todos los horarios del ciclo', description: 'Retorna todos los horarios de todas las materias para un ciclo especifico.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Lista de horarios del ciclo' })
  findSchedulesByCycle(@Param('cycleId') cycleId: string) {
    return this.subjectsService.findSchedulesByCycle(cycleId);
  }
}
