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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LegacySubjectsService } from './legacy-subjects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Legacy Subjects (Materias previas al sistema)')
@ApiBearerAuth('jwt-auth')
@Controller('legacy-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
export class LegacySubjectsController {
  constructor(private readonly legacySubjectsService: LegacySubjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar materias cursadas previas al sistema',
    description:
      'Retorna los registros de materias cursadas antes de la creacion del sistema. Opcionalmente filtradas por estudiante.',
  })
  @ApiQuery({ name: 'studentId', required: false, description: 'UUID del estudiante' })
  @ApiResponse({ status: 200, description: 'Lista de registros' })
  findAll(@Query('studentId') studentId?: string) {
    return this.legacySubjectsService.findAll(studentId);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar materia cursada previa al sistema',
    description:
      'Registra una materia que el estudiante curso antes del sistema, con la nota obtenida.',
  })
  @ApiResponse({ status: 201, description: 'Registro creado' })
  @ApiResponse({ status: 400, description: 'Datos invalidos o materia duplicada' })
  create(
    @Body()
    body: {
      studentId: string;
      subjectId: string;
      score: number;
      year?: number | null;
      semester?: number | null;
      notes?: string | null;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.legacySubjectsService.register(body, userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar registro de materia cursada previa',
    description: 'Actualiza la nota, ano, semestre o notas de un registro.',
  })
  @ApiParam({ name: 'id', description: 'UUID del registro' })
  @ApiResponse({ status: 200, description: 'Registro actualizado' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      score?: number;
      year?: number | null;
      semester?: number | null;
      notes?: string | null;
    },
  ) {
    return this.legacySubjectsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar registro de materia cursada previa',
    description: 'Elimina un registro de materia cursada previa al sistema.',
  })
  @ApiParam({ name: 'id', description: 'UUID del registro' })
  @ApiResponse({ status: 200, description: 'Registro eliminado' })
  remove(@Param('id') id: string) {
    return this.legacySubjectsService.remove(id);
  }
}
