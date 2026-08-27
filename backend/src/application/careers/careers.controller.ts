import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CareersService } from './careers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Careers')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar carreras', description: 'Retorna todas las carreras, con all=true incluye las inactivas.' })
  @ApiQuery({ name: 'all', required: false, description: 'Incluir carreras inactivas', example: 'true' })
  @ApiResponse({ status: 200, description: 'Lista de carreras' })
  findAll(@Query('all') all?: string) {
    return this.careersService.findAll(all !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener carrera por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la carrera' })
  @ApiResponse({ status: 200, description: 'Carrera encontrada' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  findById(@Param('id') id: string) {
    return this.careersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear carrera', description: 'Crea una nueva carrera. Los anos y semestres por ano definen la estructura del pensum.' })
  @ApiResponse({ status: 201, description: 'Carrera creada exitosamente' })
  create(@Body() body: any) {
    return this.careersService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Actualizar carrera', description: 'Actualiza nombre, codigo, descripcion y estructura del pensum (anos/semestres).' })
  @ApiParam({ name: 'id', description: 'UUID de la carrera' })
  @ApiResponse({ status: 200, description: 'Carrera actualizada' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.careersService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Desactivar carrera', description: 'Desactiva una carrera. No permite desactivar si tiene materias activas asignadas.' })
  @ApiParam({ name: 'id', description: 'UUID de la carrera' })
  @ApiResponse({ status: 200, description: 'Carrera desactivada' })
  remove(@Param('id') id: string) {
    return this.careersService.remove(id);
  }

  @Put(':id/reactivate')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Reactivar carrera', description: 'Vuelve a activar una carrera previamente desactivada.' })
  @ApiParam({ name: 'id', description: 'UUID de la carrera' })
  @ApiResponse({ status: 200, description: 'Carrera reactivada' })
  reactivate(@Param('id') id: string) {
    return this.careersService.reactivate(id);
  }
}