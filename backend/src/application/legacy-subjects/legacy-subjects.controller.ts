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
  UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { LegacySubjectsService } from './legacy-subjects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { LegacyImportService } from './legacy-import.service';
import { MAX_XLSX_BYTES } from './safe-xlsx';

@ApiTags('Legacy Subjects (Materias previas al sistema)')
@ApiBearerAuth('jwt-auth')
@Controller('legacy-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
export class LegacySubjectsController {
  constructor(private readonly legacySubjectsService: LegacySubjectsService,
    private readonly legacyImportService: LegacyImportService) {}

  @Get('template')
  @ApiOperation({ summary: 'Descargar plantilla Excel de notas previas con instrucciones y catálogo' })
  @ApiResponse({ status: 200, description: 'Archivo XLSX', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } })
  async template(@Res() response: Response) {
    const buffer = await this.legacyImportService.template();
    response.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-notas-previas.xlsx"', 'Cache-Control': 'private, no-store' });
    response.send(buffer);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_XLSX_BYTES, files: 1, fields: 0, parts: 2 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Importar hasta 500 notas previas desde XLSX (máximo 2 MB)',
    description: 'Solo administrador/administrativo. Valida todo antes de guardar; no sobrescribe registros. Fórmulas, macros, enlaces y objetos rechazados. Errores por fila (hasta 50), sin guardar parcialmente.' })
  @ApiResponse({ status: 201, description: 'Lote guardado: imported y students' })
  @ApiResponse({ status: 400, description: 'Archivo o filas inválidos; ninguna nota guardada' })
  @ApiResponse({ status: 409, description: 'Importación en curso o duplicado concurrente' })
  @ApiResponse({ status: 413, description: 'Archivo demasiado grande' })
  importFile(@UploadedFile() file: Express.Multer.File, @CurrentUser('sub') userId: string) {
    return this.legacyImportService.importFile(file, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar materias cursadas previas al sistema',
    description:
      'Retorna los registros de materias cursadas antes de la creación del sistema. Opcionalmente filtradas por estudiante.',
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
    description: 'Actualiza la nota, año, semestre o notas de un registro.',
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
