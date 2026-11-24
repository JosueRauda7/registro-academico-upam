import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CreateClassroomDto } from './dto/create-classroom.dto';

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
  @ApiOperation({ summary: 'Obtener salón por ID' })
  @ApiParam({ name: 'id', description: 'UUID del salón' })
  @ApiResponse({ status: 200, description: 'Salón encontrado' })
  @ApiResponse({ status: 404, description: 'Salón no encontrado' })
  findById(@Param('id') id: string) {
    return this.classroomsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear salón', description: 'Registra un nuevo salón/aula.' })
  @ApiResponse({ status: 201, description: 'Salón creado exitosamente' })
  create(@Body() body: CreateClassroomDto) {
    return this.classroomsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar salón', description: 'Actualiza los datos del salón (capacidad, edificio, etc).' })
  @ApiParam({ name: 'id', description: 'UUID del salón' })
  @ApiResponse({ status: 200, description: 'Salón actualizado' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.classroomsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Desactivar salón', description: 'Marca el salón como inactivo.' })
  @ApiParam({ name: 'id', description: 'UUID del salón' })
  @ApiResponse({ status: 200, description: 'Salón desactivado' })
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(id);
  }
}
