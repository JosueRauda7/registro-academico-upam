import { CreateCycleDto, UpdateCycleDto } from './dto/cycle.dto';
import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CyclesService } from './cycles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Cycles')
@ApiBearerAuth('jwt-auth')
@Controller('cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los ciclos', description: 'Retorna todos los ciclos académicos registrados.' })
  @ApiResponse({ status: 200, description: 'Lista de ciclos' })
  findAll() {
    return this.cyclesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener ciclos activos', description: 'Retorna los ciclos con estado activo.' })
  @ApiResponse({ status: 200, description: 'Ciclos activos' })
  findActive() {
    return this.cyclesService.findActive();
  }

  @Get('open-enrollment')
  @ApiOperation({ summary: 'Ciclos abiertos a inscripción', description: 'Retorna ciclos donde la inscripción de materias está habilitada.' })
  @ApiResponse({ status: 200, description: 'Ciclos con inscripción abierta' })
  findOpenForEnrollment() {
    return this.cyclesService.findOpenForEnrollment();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ciclo por ID' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Ciclo encontrado' })
  @ApiResponse({ status: 404, description: 'Ciclo no encontrado' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.cyclesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Crear ciclo académico', description: 'Administradores y administrativos pueden crear ciclos.' })
  @ApiResponse({ status: 201, description: 'Ciclo creado exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos de gestión' })
  create(@Body() body: CreateCycleDto) {
    return this.cyclesService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Actualizar ciclo académico' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Ciclo actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de gestión' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCycleDto) {
    return this.cyclesService.update(id, body);
  }

  @Put(':id/open-enrollment')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Abrir inscripción de materias', description: 'Habilita la inscripción de materias para el ciclo.' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Inscripción abierta' })
  @ApiResponse({ status: 400, description: 'El ciclo no está activo' })
  openEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.cyclesService.openEnrollment(id);
  }

  @Put(':id/close-enrollment')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Cerrar inscripción de materias', description: 'Deshabilita la inscripción de materias para el ciclo.' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Inscripción cerrada' })
  @ApiResponse({ status: 400, description: 'El ciclo no está activo' })
  closeEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.cyclesService.closeEnrollment(id);
  }
}
