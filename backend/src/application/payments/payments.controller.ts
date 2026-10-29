import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('tuition/:cycleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Pagar matrícula', description: 'Crea un pago de matrícula para el ciclo indicado. Redirige a Wompi para completar el pago.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 201, description: 'Pago de matrícula creado, retorna URL de Wompi' })
  @ApiResponse({ status: 400, description: 'Ya existe pago de matrícula para este ciclo' })
  @ApiResponse({ status: 403, description: 'Solo estudiantes pueden pagar' })
  createTuitionPayment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.createTuitionPayment(userId, cycleId);
  }

  @Post('monthly/:cycleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Pagar mensualidad', description: 'Crea un pago mensual para el ciclo indicado. Se específica el número de mes a pagar.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiBody({ schema: { type: 'object', properties: { month: { type: 'number', example: 1, description: 'Número del mes (1-6)' } }, required: ['month'] } })
  @ApiResponse({ status: 201, description: 'Pago mensual creado, retorna URL de Wompi' })
  @ApiResponse({ status: 400, description: 'Mes ya pagado o fuera de rango' })
  @ApiResponse({ status: 403, description: 'Solo estudiantes pueden pagar' })
  createMonthlyPayment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
    @Body('month') month: number,
  ) {
    return this.paymentsService.createMonthlyPayment(userId, cycleId, month);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COLLECTOR, UserRole.ADMINISTRATOR)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({
    summary: 'Registrar pago manual',
    description: 'Permite al colector o administrador registrar un pago recibido en efectivo o por transacción bancaria directamente en el sistema. El monto debe coincidir con el valor del ciclo.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['studentId', 'cycleId', 'amount', 'type'],
      properties: {
        studentId: { type: 'string', description: 'UUID del estudiante', example: 'uuid-estudiante' },
        cycleId: { type: 'string', description: 'UUID del ciclo', example: 'uuid-ciclo' },
        amount: { type: 'number', description: 'Monto en USD (debe ser exactamente el valor del ciclo)', example: 150.00 },
        type: { type: 'string', enum: ['tuition', 'monthly'], description: 'Tipo de pago', example: 'tuition' },
        month: { type: 'number', description: 'Número del mes (si es mensualidad, 1-6)', example: 1 },
        description: { type: 'string', description: 'Observaciones del pago', example: 'Pago recibido en ventanilla' },
        paymentMethod: { type: 'string', enum: ['cash', 'bank'], description: 'Método de pago', example: 'cash' },
        bankName: { type: 'string', description: 'Banco (requerido si paymentMethod=bank)', example: 'Banco Agrícola' },
        bankTransactionCode: { type: 'string', description: 'Código de transacción bancaria (requerido si paymentMethod=bank)', example: 'TRX-2026-000123' },
        receiptImageUrl: { type: 'string', description: 'URL del comprobante subido a /uploads (opcional)', example: '/uploads/uuid.webp' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Pago manual registrado exitosamente (estado: completed)' })
  @ApiResponse({ status: 400, description: 'Datos invalidos o pago ya registrado' })
  @ApiResponse({ status: 404, description: 'Estudiante o ciclo no encontrado' })
  createManualPayment(
    @CurrentUser('sub') collectorId: string,
    @Body() body: {
      studentId: string;
      cycleId: string;
      amount: number;
      type: 'tuition' | 'monthly';
      month?: number;
      description?: string;
      paymentMethod?: 'cash' | 'bank';
      bankName?: string;
      bankTransactionCode?: string;
      receiptImageUrl?: string;
    },
  ) {
    return this.paymentsService.createManualPayment(collectorId, body);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook de Wompi',
    description: 'Evento transaction.updated de Wompi.co. Requiere checksum válido en signature, ID firmado y cotejo con la transacción remota vinculada al pago.',
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado' })
  handleWebhook(@Req() req: any) {
    return this.paymentsService.handleWompiWebhook(req.body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Mis pagos', description: 'Retorna todos los pagos realizados por el estudiante autenticado.' })
  @ApiResponse({ status: 200, description: 'Lista de pagos del estudiante' })
  getMyPayments(@CurrentUser('sub') userId: string) {
    return this.paymentsService.getMyPayments(userId);
  }

  @Get('my/:cycleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Mis pagos en un ciclo', description: 'Retorna los pagos del estudiante para un ciclo específico.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Pagos del ciclo' })
  getMyPaymentsByCycle(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.getMyPaymentsByCycle(userId, cycleId);
  }

  @Get('my/:cycleId/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Mis mensualidades en un ciclo', description: 'Retorna el estado de las mensualidades del estudiante en un ciclo.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Estado de mensualidades' })
  getMonthlyPayments(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.getMonthlyPayments(userId, cycleId);
  }

  @Get('my/:cycleId/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Resumen de pagos del ciclo', description: 'Retorna un resumen del total pagado, pendiente y desglose por tipo.' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Resumen de pagos' })
  getMyPaymentSummary(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.getMyPaymentSummary(userId, cycleId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR, UserRole.COLLECTOR)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Todos los pagos', description: 'Retorna todos los pagos del sistema (solo administradores y colectores).' })
  @ApiQuery({ name: 'cycleId', required: false, description: 'UUID del ciclo para filtrar' })
  @ApiResponse({ status: 200, description: 'Lista de pagos' })
  getAllPayments(@Query('cycleId') cycleId?: string) {
    return this.paymentsService.getAllPayments(cycleId);
  }

  @Get('stats/:cycleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR, UserRole.COLLECTOR)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Estadisticas de pagos del ciclo', description: 'Retorna estadisticas de recaudación para un ciclo (total, matrículas, mensualidades).' })
  @ApiParam({ name: 'cycleId', description: 'UUID del ciclo' })
  @ApiResponse({ status: 200, description: 'Estadisticas de pagos' })
  getPaymentStats(@Param('cycleId') cycleId: string) {
    return this.paymentsService.getPaymentStats(cycleId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiParam({ name: 'id', description: 'UUID del pago' })
  @ApiResponse({ status: 200, description: 'Pago encontrado' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  getPaymentById(@Param('id') id: string, @CurrentUser() actor: { sub: string; role: UserRole }) {
    return this.paymentsService.getPaymentById(id, actor);
  }
}
