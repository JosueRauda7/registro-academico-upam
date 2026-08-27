import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Classrooms')
@ApiBearerAuth('jwt-auth')
@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Listar salones', description: 'Retorna todos los salones/aulas.' })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Filtrar solo activos', example: 'true' })
  @ApiResponse({ status: 200, description: 'Lista de salones' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.classroomsService.findAll(activeOnly === 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Obtener salon por ID' })
  @ApiParam({ name: 'id', description: 'UUID del salon' })
  @ApiResponse({ status: 200, description: 'Salon encontrado' })
  @ApiResponse({ status: 404, description: 'Salon no encontrado' })
  findById(@Param('id') id: string) {
    return this.classroomsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Crear salon', description: 'Registra un nuevo salon/aula.' })
  @ApiResponse({ status: 201, description: 'Salon creado exitosamente' })
  create(@Body() body: any) {
    return this.classroomsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar salon', description: 'Actualiza los datos del salon (capacidad, edificio, etc).' })
  @ApiParam({ name: 'id', description: 'UUID del salon' })
  @ApiResponse({ status: 200, description: 'Salon actualizado' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.classroomsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Desactivar salon', description: 'Marca el salon como inactivo.' })
  @ApiParam({ name: 'id', description: 'UUID del salon' })
  @ApiResponse({ status: 200, description: 'Salon desactivado' })
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(id);
  }
}