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
    summary: 'Configuración publica',
    description: 'Retorna la configuración de marca (logo, color principal, nombre) para el frontend. No requiere autenticación.',
  })
  @ApiResponse({ status: 200, description: 'Configuración publica' })
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Obtener configuración del sistema', description: 'Solo administradores.' })
  @ApiResponse({ status: 200, description: 'Configuración del sistema' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Actualizar configuración del sistema', description: 'Actualiza logo, color principal o nombre de la institución. Solo administradores.' })
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
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  update(@Body() body: any) {
    return this.settingsService.update(body);
  }
}