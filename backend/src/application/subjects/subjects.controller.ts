import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(@Query('career') career?: string) {
    return this.subjectsService.findAll(career);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.subjectsService.findById(id);
  }

  @Get(':id/schedules')
  findSchedules(@Param('id') id: string, @Query('cycleId') cycleId: string) {
    return this.subjectsService.findSchedules(id, cycleId);
  }

  @Get(':id/prerequisites')
  getPrerequisites(@Param('id') id: string) {
    return this.subjectsService.getPrerequisites(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  create(@Body() body: any) {
    return this.subjectsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  update(@Param('id') id: string, @Body() body: any) {
    return this.subjectsService.update(id, body);
  }

  @Post('schedules')
  @Roles(UserRole.ADMINISTRATOR)
  createSchedule(@Body() body: any) {
    return this.subjectsService.createSchedule(body);
  }

  @Get('schedules/cycle/:cycleId')
  findSchedulesByCycle(@Param('cycleId') cycleId: string) {
    return this.subjectsService.findSchedulesByCycle(cycleId);
  }
}
