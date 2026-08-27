import { Module } from '@nestjs/common';
import { LegacySubjectsService } from './legacy-subjects.service';
import { LegacySubjectsController } from './legacy-subjects.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [LegacySubjectsController],
  providers: [LegacySubjectsService],
  exports: [LegacySubjectsService],
})
export class LegacySubjectsModule {}
