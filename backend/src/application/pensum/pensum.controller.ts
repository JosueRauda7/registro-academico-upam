import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PensumService } from './pensum.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Pensum')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE, UserRole.STUDENT)
@Controller('pensum')
export class PensumController {
  constructor(private readonly pensumService: PensumService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener pensum',
    description:
      'Estudiante: retorna el pensum de su carrera con el estado de cada materia (cursada, inscrita, pendiente) y su historial por ciclo. Admin/Administrativo: requiere el parametro career para gestionar el pensum de una carrera.',
  })
  @ApiQuery({ name: 'career', required: false, description: 'Carrera (obligatorio para admin/administrativo)', example: 'Ingeniería en Sistemas' })
  @ApiResponse({ status: 200, description: 'Pensum estructurado por año y semestre' })
  getPensum(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
    @Query('career') career?: string,
  ) {
    return this.pensumService.getPensum(userId, role, career);
  }
}