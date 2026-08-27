import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Enrollments')
@ApiBearerAuth('jwt-auth')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Mis inscripciones', description: 'Retorna todas las inscripciones del estudiante autenticado.' })
  @ApiResponse({ status: 200, description: 'Lista de inscripciones del estudiante' })
  getMyEnrollments(@CurrentUser('sub') userId: string) {
    return this.enrollmentsService.getMyEnrollments(userId);
  }

  @Get('my/:cycleId')
  @ApiOperation({ summary: 'Mi inscripcion en un ciclo', description: 'Retorna la inscripcion del estudiante en un ciclo especifico con sus materias.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Inscripcion con materias' })
  @ApiResponse({ status: 404, description: 'Inscripcion no encontrada' })
  getMyEnrollment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.enrollmentsService.getEnrollment(userId, cycleId);
  }

  @Post('cycle/:cycleId')
  @ApiOperation({ summary: 'Inscribirse en un ciclo', description: 'Crea una inscripcion para el estudiante en el ciclo indicado. Requiere pago de matricula previo.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 201, description: 'Inscripcion creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe inscripcion en este ciclo o no hay pago de matricula' })
  enrollInCycle(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.enrollmentsService.enrollInCycle(userId, cycleId);
  }

  @Post('subject')
  @ApiOperation({
    summary: 'Inscribir materia',
    description: 'Inscribe una materia en la inscripcion del estudiante. Valida prerequisitos, disponibilidad de cupos y conflictos de horario.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cycleId', 'subjectId', 'scheduleId'],
      properties: {
        cycleId: { type: 'string', description: 'UUID del ciclo', example: 'uuid-ciclo' },
        subjectId: { type: 'string', description: 'UUID de la materia', example: 'uuid-materia' },
        scheduleId: { type: 'string', description: 'UUID del horario', example: 'uuid-horario' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Materia inscrita exitosamente (estado: reserved)' })
  @ApiResponse({ status: 400, description: 'Prerequisito faltante, sin cupos o conflicto de horario' })
  @ApiResponse({ status: 404, description: 'Inscripcion no encontrada' })
  enrollSubject(
    @CurrentUser('sub') userId: string,
    @Body() body: { cycleId: string; subjectId: string; scheduleId: string },
  ) {
    return this.enrollmentsService.enrollSubject(
      userId,
      body.cycleId,
      body.subjectId,
      body.scheduleId,
    );
  }

  @Put('subject/:id/cancel')
  @ApiOperation({ summary: 'Cancelar materia inscrita', description: 'Cancela una materia previamente inscrita y libera el cupo.' })
  @ApiParam({ name: 'id', description: 'UUID de la inscripcion-materia' })
  @ApiResponse({ status: 200, description: 'Materia cancelada y cupo liberado' })
  @ApiResponse({ status: 400, description: 'La materia ya fue confirmada' })
  cancelSubject(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.enrollmentsService.cancelSubject(userId, id);
  }

  @Post('confirm/:cycleId')
  @ApiOperation({
    summary: 'Confirmar inscripcion',
    description: 'Confirma todas las materias reservadas en la inscripcion del ciclo. Cambia el estado de "reserved" a "confirmed".',
  })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Inscripcion confirmada' })
  @ApiResponse({ status: 400, description: 'No hay materias reservadas para confirmar' })
  confirmEnrollment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.enrollmentsService.confirmEnrollment(userId, cycleId);
  }

  @Get('all')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Todas las inscripciones', description: 'Retorna todas las inscripciones del sistema, opcionalmente filtradas por ciclo.' })
  @ApiQuery({ name: 'cycleId', required: false, description: 'UUID del ciclo para filtrar' })
  @ApiResponse({ status: 200, description: 'Lista de inscripciones' })
  getAllEnrollments(@Query('cycleId') cycleId?: string) {
    return this.enrollmentsService.getAllEnrollments(cycleId);
  }

  @Get('stats/:cycleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Estadisticas de inscripcion', description: 'Retorna estadisticas de inscripciones para un ciclo (total inscritos, materias, etc).' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Estadisticas del ciclo' })
  getEnrollmentStats(@Param('cycleId') cycleId: string) {
    return this.enrollmentsService.getEnrollmentStats(cycleId);
  }
}
