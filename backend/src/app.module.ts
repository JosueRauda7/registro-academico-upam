import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './application/auth/auth.module';
import { CyclesModule } from './application/cycles/cycles.module';
import { SubjectsModule } from './application/subjects/subjects.module';
import { EnrollmentsModule } from './application/enrollments/enrollments.module';
import { PaymentsModule } from './application/payments/payments.module';
import { StudentsModule } from './application/students/students.module';
import { ReportsModule } from './application/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    CyclesModule,
    SubjectsModule,
    EnrollmentsModule,
    PaymentsModule,
    StudentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
