import { Module } from '@nestjs/common';
import { SubjectGroupsService } from './subject-groups.service';
import { SubjectGroupsController } from './subject-groups.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SubjectGroupsController],
  providers: [SubjectGroupsService],
  exports: [SubjectGroupsService],
})
export class SubjectGroupsModule {}