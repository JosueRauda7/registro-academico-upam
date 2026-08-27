import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SystemSettingRepository } from '../../infrastructure/database/repositories/system-setting.repository';

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

@Injectable()
export class SettingsService {
  constructor(private readonly systemSettingRepository: SystemSettingRepository) {}

  async getPublic() {
    const settings = await this.systemSettingRepository.getSettings();
    if (!settings) {
      return {
        logoUrl: null,
        primaryColor: '#1B4F72',
        institutionName: 'Universidad Panamericana de El Salvador',
      };
    }
    return {
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      institutionName: settings.institutionName,
    };
  }

  async getSettings() {
    const settings = await this.systemSettingRepository.getSettings();
    if (!settings) {
      throw new NotFoundException('Configuracion del sistema no encontrada');
    }
    return settings;
  }

  async update(data: { logoUrl?: string | null; primaryColor?: string; institutionName?: string }) {
    const updateData: any = {};
    if (data.logoUrl !== undefined) {
      if (data.logoUrl === null || data.logoUrl === '') {
        updateData.logoUrl = null;
      } else {
        updateData.logoUrl = data.logoUrl;
      }
    }
    if (data.primaryColor !== undefined) {
      if (!HEX_COLOR_REGEX.test(data.primaryColor)) {
        throw new BadRequestException('El color debe ser un hexadecimal valido (ej. #1B4F72)');
      }
      updateData.primaryColor = data.primaryColor;
    }
    if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;

    const updated = await this.systemSettingRepository.updateSettings(updateData);
    return {
      logoUrl: updated.logoUrl,
      primaryColor: updated.primaryColor,
      institutionName: updated.institutionName,
    };
  }
}