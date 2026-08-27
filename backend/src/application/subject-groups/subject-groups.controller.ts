import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SubjectGroupsService } from './subject-groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Subject Groups')
@ApiBearerAuth('jwt-auth')
@Controller('subject-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectGroupsController {
  constructor(private readonly subjectGroupsService: SubjectGroupsService) {}

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Listar grupos',
    description: 'Retorna todos los grupos de materias, opcionalmente filtrados por ciclo.',
  })
  @ApiQuery({ name: 'cycleId', required: false, description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Lista de grupos' })
  findAll(@Query('cycleId') cycleId?: string) {
    return this.subjectGroupsService.findAll(cycleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener grupo por ID', description: 'Retorna un grupo con sus horarios, docente, salon y materia.' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  findById(@Param('id') id: string) {
    return this.subjectGroupsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Crear grupo',
    description: 'Crea un grupo de materia en un ciclo con docente, salon y horarios.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['subjectId', 'cycleId', 'classroomId'],
      properties: {
        subjectId: { type: 'string', example: 'uuid-materia' },
        cycleId: { type: 'string', example: 'uuid-ciclo' },
        teacherId: { type: 'string', example: 'uuid-docente' },
        classroomId: { type: 'string', example: 'uuid-salon' },
        groupNumber: { type: 'number', example: 1 },
        capacity: { type: 'number', example: 40 },
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dayOfWeek: { type: 'string', example: 'monday' },
              startTime: { type: 'string', example: '07:00' },
              endTime: { type: 'string', example: '09:00' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Grupo creado exitosamente' })
  create(@Body() body: any) {
    const { schedules, ...data } = body;
    return this.subjectGroupsService.create(data, schedules);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Actualizar grupo',
    description: 'Actualiza docente, salon o capacidad del grupo. Permite cambiar la materia de salon.',
  })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo actualizado' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.subjectGroupsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Eliminar grupo', description: 'Elimina un grupo si no tiene estudiantes inscritos.' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo eliminado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar un grupo con inscritos' })
  remove(@Param('id') id: string) {
    return this.subjectGroupsService.remove(id);
  }

  @Post(':id/schedules')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Agregar horario al grupo', description: 'Agrega un bloque de horario (dia y hora) a un grupo.' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 201, description: 'Horario agregado' })
  addSchedule(@Param('id') id: string, @Body() body: any) {
    return this.subjectGroupsService.addSchedule(id, body);
  }

  @Delete(':id/schedules/:scheduleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Eliminar horario del grupo' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiParam({ name: 'scheduleId', description: 'UUID del horario' })
  @ApiResponse({ status: 200, description: 'Horario eliminado' })
  removeSchedule(@Param('scheduleId') scheduleId: string) {
    return this.subjectGroupsService.removeSchedule(scheduleId);
  }
}