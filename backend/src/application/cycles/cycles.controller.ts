import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@Controller('cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  findAll() {
    return this.cyclesService.findAll();
  }

  @Get('active')
  findActive() {
    return this.cyclesService.findActive();
  }

  @Get('open-enrollment')
  findOpenForEnrollment() {
    return this.cyclesService.findOpenForEnrollment();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.cyclesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATOR)
  create(@Body() body: any) {
    return this.cyclesService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRATOR)
  update(@Param('id') id: string, @Body() body: any) {
    return this.cyclesService.update(id, body);
  }

  @Put(':id/open-enrollment')
  @Roles(UserRole.ADMINISTRATOR)
  openEnrollment(@Param('id') id: string) {
    return this.cyclesService.openEnrollment(id);
  }

  @Put(':id/close-enrollment')
  @Roles(UserRole.ADMINISTRATOR)
  closeEnrollment(@Param('id') id: string) {
    return this.cyclesService.closeEnrollment(id);
  }
}
