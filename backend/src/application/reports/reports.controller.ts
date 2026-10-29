import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiProduces } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Reports')
@ApiBearerAuth('jwt-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('student-payments/:studentId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.COLLECTOR, UserRole.STUDENT)
  @ApiOperation({
    summary: 'Reporte de pagos de estudiante',
    description: 'Genera un reporte de pagos de un estudiante. Soporta formato Excel (.xlsx) o PDF.',
  })
  @ApiParam({ name: 'studentId', description: 'UUID del estudiante' })
  @ApiQuery({ name: 'cycleId', required: false, description: 'UUID del ciclo para filtrar' })
  @ApiQuery({ name: 'format', required: false, enum: ['xlsx', 'pdf'], description: 'Formato del reporte (default: xlsx)' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo de reporte generado' })
  async getStudentPaymentsReport(
    @Param('studentId') studentId: string,
    @Query('cycleId') cycleId: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateStudentPaymentsReport(studentId, cycleId);

    if (format === 'pdf') {
      const pdfBuffer = await this.reportsService.generatePdfPaymentReceipt(studentId);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=reporte-pagos.pdf',
      });
      res.send(pdfBuffer);
    } else {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=reporte-pagos.xlsx',
      });
      res.send(Buffer.from(buffer));
    }
  }

  @Get('enrollments/:cycleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Reporte de inscripciones', description: 'Genera un reporte Excel de todas las inscripciones de un ciclo.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async getEnrollmentReport(
    @Param('cycleId') cycleId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateEnrollmentReport(cycleId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=reporte-inscripciones.xlsx',
    });
    res.send(Buffer.from(buffer));
  }

  @Get('collection/:cycleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.COLLECTOR)
  @ApiOperation({ summary: 'Reporte de recaudación', description: 'Genera un reporte Excel de recaudación por ciclo (matrículas y mensualidades).' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async getCollectionReport(
    @Param('cycleId') cycleId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateCollectionReport(cycleId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=reporte-recaudacion.xlsx',
    });
    res.send(Buffer.from(buffer));
  }

  @Get('student-list/:cycleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Lista de estudiantes', description: 'Genera un reporte Excel con la lista de estudiantes inscritos en un ciclo.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async getStudentListReport(
    @Param('cycleId') cycleId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateStudentListReport(cycleId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=lista-estudiantes.xlsx',
    });
    res.send(Buffer.from(buffer));
  }

  @Get('payment-receipt/:paymentId')
  @ApiOperation({ summary: 'Comprobante de pago (PDF)', description: 'Genera un comprobante de pago en formato PDF.' })
  @ApiParam({ name: 'paymentId', description: 'UUID del pago' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF del comprobante generado' })
  async getPaymentReceipt(
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.generatePdfPaymentReceipt(paymentId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=comprobante-pago.pdf',
    });
    res.send(pdfBuffer);
  }
}
