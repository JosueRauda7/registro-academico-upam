import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@ApiTags('Teachers')
@ApiBearerAuth('jwt-auth')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Listar docentes', description: 'Retorna todos los catedraticos (docentes).' })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Filtrar solo activos', example: 'true' })
  @ApiResponse({ status: 200, description: 'Lista de docentes' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.teachersService.findAll(activeOnly === 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Obtener docente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del docente' })
  @ApiResponse({ status: 200, description: 'Docente encontrado' })
  @ApiResponse({ status: 404, description: 'Docente no encontrado' })
  findById(@Param('id') id: string) {
    return this.teachersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear docente', description: 'Registra un nuevo catedrático.' })
  @ApiResponse({ status: 201, description: 'Docente creado exitosamente' })
  create(@Body() body: CreateTeacherDto) {
    return this.teachersService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar docente' })
  @ApiParam({ name: 'id', description: 'UUID del docente' })
  @ApiResponse({ status: 200, description: 'Docente actualizado' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.teachersService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Desactivar docente', description: 'Marca al docente como inactivo (baja logica).' })
  @ApiParam({ name: 'id', description: 'UUID del docente' })
  @ApiResponse({ status: 200, description: 'Docente desactivado' })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
