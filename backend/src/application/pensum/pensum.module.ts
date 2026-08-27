import { Module } from '@nestjs/common';
import { PensumService } from './pensum.service';
import { PensumController } from './pensum.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PensumController],
  providers: [PensumService],
  exports: [PensumService],
})
export class PensumModule {}