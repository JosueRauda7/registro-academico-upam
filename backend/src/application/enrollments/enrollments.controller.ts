import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('my')
  getMyEnrollments(@CurrentUser('sub') userId: string) {
    return this.enrollmentsService.getMyEnrollments(userId);
  }

  @Get('my/:cycleId')
  getMyEnrollment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.enrollmentsService.getEnrollment(userId, cycleId);
  }

  @Post('cycle/:cycleId')
  enrollInCycle(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.enrollmentsService.enrollInCycle(userId, cycleId);
  }

  @Post('subject')
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
  cancelSubject(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.enrollmentsService.cancelSubject(userId, id);
  }

  @Post('confirm/:cycleId')
  confirmEnrollment(
    @CurrentUser('sub') userId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.enrollmentsService.confirmEnrollment(userId, cycleId);
  }

  @Get('all')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  getAllEnrollments(@Query('cycleId') cycleId?: string) {
    return this.enrollmentsService.getAllEnrollments(cycleId);
  }

  @Get('stats/:cycleId')
  @Roles(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)
  getEnrollmentStats(@Param('cycleId') cycleId: string) {
    return this.enrollmentsService.getEnrollmentStats(cycleId);
  }
}
