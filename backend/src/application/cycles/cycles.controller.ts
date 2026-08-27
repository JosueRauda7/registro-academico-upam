import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Listar todos los ciclos', description: 'Retorna todos los ciclos academicos registrados.' })
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
  @ApiOperation({ summary: 'Ciclos abiertos a inscripcion', description: 'Retorna ciclos donde la inscripcion de materias esta habilitada.' })
  @ApiResponse({ status: 200, description: 'Ciclos con inscripcion abierta' })
  findOpenForEnrollment() {
    return this.cyclesService.findOpenForEnrollment();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ciclo por ID' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Ciclo encontrado' })
  @ApiResponse({ status: 404, description: 'Ciclo no encontrado' })
  findById(@Param('id') id: string) {
    return this.cyclesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Crear ciclo academico', description: 'Solo administradores pueden crear ciclos.' })
  @ApiResponse({ status: 201, description: 'Ciclo creado exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  create(@Body() body: any) {
    return this.cyclesService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar ciclo academico' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Ciclo actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.cyclesService.update(id, body);
  }

  @Put(':id/open-enrollment')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Abrir inscripcion de materias', description: 'Habilita la inscripcion de materias para el ciclo.' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Inscripcion abierta' })
  @ApiResponse({ status: 400, description: 'El ciclo no esta activo' })
  openEnrollment(@Param('id') id: string) {
    return this.cyclesService.openEnrollment(id);
  }

  @Put(':id/close-enrollment')
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Cerrar inscripcion de materias', description: 'Deshabilita la inscripcion de materias para el ciclo.' })
  @ApiParam({ name: 'id', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Inscripcion cerrada' })
  @ApiResponse({ status: 400, description: 'El ciclo no esta activo' })
  closeEnrollment(@Param('id') id: string) {
    return this.cyclesService.closeEnrollment(id);
  }
}
