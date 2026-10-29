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
import { TeachersModule } from './application/teachers/teachers.module';
import { ClassroomsModule } from './application/classrooms/classrooms.module';
import { SubjectGroupsModule } from './application/subject-groups/subject-groups.module';
import { UsersModule } from './application/users/users.module';
import { SettingsModule } from './application/settings/settings.module';
import { PensumModule } from './application/pensum/pensum.module';
import { CareersModule } from './application/careers/careers.module';
import { GradesModule } from './application/grades/grades.module';
import { LegacySubjectsModule } from './application/legacy-subjects/legacy-subjects.module';
import { UploadsModule } from './application/uploads/uploads.module';

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
    TeachersModule,
    ClassroomsModule,
    SubjectGroupsModule,
    UsersModule,
    SettingsModule,
    PensumModule,
    CareersModule,
    GradesModule,
    LegacySubjectsModule,
    UploadsModule,
  ],
})
export class AppModule {}
