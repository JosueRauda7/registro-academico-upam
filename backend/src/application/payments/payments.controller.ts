import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('tuition/:cycleId')
  @UseGuards(JwtAuthGuard)
  createTuitionPayment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.createTuitionPayment(userId, cycleId);
  }

  @Post('monthly/:cycleId')
  @UseGuards(JwtAuthGuard)
  createMonthlyPayment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
    @Body('month') month: number,
  ) {
    return this.paymentsService.createMonthlyPayment(userId, cycleId, month);
  }

  @Post('webhook')
  handleWebhook(@Req() req: any) {
    return this.paymentsService.handleWompiWebhook(req.body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyPayments(@CurrentUser('sub') userId: string) {
    return this.paymentsService.getMyPayments(userId);
  }

  @Get('my/:cycleId')
  @UseGuards(JwtAuthGuard)
  getMyPaymentsByCycle(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.getMyPaymentsByCycle(userId, cycleId);
  }

  @Get('my/:cycleId/monthly')
  @UseGuards(JwtAuthGuard)
  getMonthlyPayments(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.getMonthlyPayments(userId, cycleId);
  }

  @Get('my/:cycleId/summary')
  @UseGuards(JwtAuthGuard)
  getMyPaymentSummary(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.paymentsService.getMyPaymentSummary(userId, cycleId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR, UserRole.COLLECTOR)
  getAllPayments(@Query('cycleId') cycleId?: string) {
    return this.paymentsService.getAllPayments(cycleId);
  }

  @Get('stats/:cycleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR, UserRole.COLLECTOR)
  getPaymentStats(@Param('cycleId') cycleId: string) {
    return this.paymentsService.getPaymentStats(cycleId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }
}
