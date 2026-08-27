import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../domain/enums/role.enum';

@ApiTags('Settings')
@ApiBearerAuth('jwt-auth')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Configuracion publica',
    description: 'Retorna la configuracion de marca (logo, color principal, nombre) para el frontend. No requiere autenticacion.',
  })
  @ApiResponse({ status: 200, description: 'Configuracion publica' })
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Obtener configuracion del sistema', description: 'Solo administradores.' })
  @ApiResponse({ status: 200, description: 'Configuracion del sistema' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar configuracion del sistema', description: 'Actualiza logo, color principal o nombre de la institucion. Solo administradores.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logoUrl: { type: 'string', description: 'URL o data URI del logo' },
        primaryColor: { type: 'string', example: '#1B4F72' },
        institutionName: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Configuracion actualizada' })
  update(@Body() body: any) {
    return this.settingsService.update(body);
  }
}