import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Grades')
@ApiBearerAuth('jwt-auth')
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('teacher/groups')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Grupos del docente',
    description: 'Retorna los grupos (materias impartidas) del docente autenticado por ciclo.',
  })
  @ApiResponse({ status: 200, description: 'Lista de grupos del docente' })
  async getTeacherGroups(@CurrentUser('sub') userId: string) {
    return this.gradesService.getTeacherGroups(userId);
  }

  @Get('teacher/groups/:groupId')
  @Roles(UserRole.TEACHER, UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Roster de notas de un grupo',
    description: 'Lista de estudiantes registrados en el grupo con su nota actual (si existe).',
  })
  @ApiParam({ name: 'groupId', description: 'UUID del grupo de materia' })
  @ApiResponse({ status: 200, description: 'Estudiantes y notas del grupo' })
  async getGroupRoster(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('groupId') groupId: string,
  ) {
    return this.gradesService.getGroupRoster(userId, role, groupId);
  }

  @Put('teacher/groups/:groupId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Guardar notas del grupo',
    description:
      'Registra o actualiza las notas de los estudiantes del grupo. No se puede modificar si el ciclo ya finalizo.',
  })
  @ApiParam({ name: 'groupId', description: 'UUID del grupo de materia' })
  @ApiResponse({ status: 200, description: 'Notas guardadas' })
  async saveGrades(
    @CurrentUser('sub') userId: string,
    @Param('groupId') groupId: string,
    @Body() body: { grades: { enrollmentSubjectId: string; score: number }[] },
  ) {
    return this.gradesService.saveGrades(userId, groupId, body.grades);
  }

  @Get('teacher/groups/:groupId/export')
  @Roles(UserRole.TEACHER, UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({
    summary: 'Exportar notas del grupo (Excel)',
    description: 'Genera un archivo Excel con la lista de estudiantes y notas del grupo.',
  })
  @ApiParam({ name: 'groupId', description: 'UUID del grupo de materia' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportGroup(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('groupId') groupId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.gradesService.generateTeacherRosterExcel(role, userId, groupId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=notas-grupo-${groupId}.xlsx`,
    });
    res.send(Buffer.from(buffer));
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Mis notas y CUM',
    description: 'Retorna los registros de calificaciones y el CUM (indice académico) del estudiante.',
  })
  @ApiResponse({ status: 200, description: 'Notas y CUM del estudiante' })
  async getMyGrades(@CurrentUser('sub') userId: string) {
    const student = await this.gradesService.getStudentByUserId(userId);
    return this.gradesService.getMyGrades(student.id);
  }
}