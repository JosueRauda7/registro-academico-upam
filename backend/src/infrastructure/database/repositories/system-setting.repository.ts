import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';

@Injectable()
export class SystemSettingRepository {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) {}

  async getSettings(): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { id: 1 } });
  }

  async updateSettings(data: Partial<SystemSetting>): Promise<SystemSetting> {
    const existing = await this.getSettings();
    if (existing) {
      await this.repo.update(1, data);
      return (await this.repo.findOne({ where: { id: 1 } }))!;
    }
    return this.repo.save(this.repo.create({ id: 1, ...data }));
  }
}