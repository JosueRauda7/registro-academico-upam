import { CreateGroupDto, UpdateGroupDto, ScheduleDto } from './dto/group.dto';
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
  ParseUUIDPipe,
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
  @ApiOperation({ summary: 'Obtener grupo por ID', description: 'Retorna un grupo con sus horarios, docente, salón y materia.' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.subjectGroupsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Crear grupo',
    description: 'Crea un grupo de materia en un ciclo con docente, salón y horarios.',
  })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({ status: 409, description: 'Cruce de docente, salón u horarios' })
  @ApiResponse({ status: 201, description: 'Grupo creado exitosamente' })
  create(@Body() body: CreateGroupDto) {
    const { schedules, ...data } = body;
    return this.subjectGroupsService.create(data, schedules);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Actualizar grupo',
    description: 'Actualiza docente, salón o capacidad del grupo. Permite cambiar la materia de salón.',
  })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo actualizado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateGroupDto) {
    return this.subjectGroupsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Eliminar grupo', description: 'Elimina un grupo si no tiene estudiantes inscritos.' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 200, description: 'Grupo eliminado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar un grupo con inscritos' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subjectGroupsService.remove(id);
  }

  @Post(':id/schedules')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Agregar horario al grupo', description: 'Agrega un bloque de horario (dia y hora) a un grupo.' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiResponse({ status: 201, description: 'Horario agregado' })
  addSchedule(@Param('id', ParseUUIDPipe) id: string, @Body() body: ScheduleDto) {
    return this.subjectGroupsService.addSchedule(id, body);
  }

  @Delete(':id/schedules/:scheduleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Eliminar horario del grupo' })
  @ApiParam({ name: 'id', description: 'UUID del grupo' })
  @ApiParam({ name: 'scheduleId', description: 'UUID del horario' })
  @ApiResponse({ status: 200, description: 'Horario eliminado' })
  removeSchedule(@Param('id', ParseUUIDPipe) id: string, @Param('scheduleId', ParseUUIDPipe) scheduleId: string) {
    return this.subjectGroupsService.removeSchedule(id, scheduleId);
  }
}