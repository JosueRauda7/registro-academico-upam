import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { StudentEntity } from './entities/student.entity';
import { Cycle } from './entities/cycle.entity';
import { Subject } from './entities/subject.entity';
import { Prerequisite } from './entities/prerequisite.entity';
import { Schedule } from './entities/schedule.entity';
import { Enrollment } from './entities/enrollment.entity';
import { EnrollmentSubject } from './entities/enrollment-subject.entity';
import { Payment } from './entities/payment.entity';
import { Teacher } from './entities/teacher.entity';
import { Classroom } from './entities/classroom.entity';
import { SubjectGroup } from './entities/subject-group.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Career } from './entities/career.entity';
import { Grade } from './entities/grade.entity';
import { LegacyCompletedSubject } from './entities/legacy-completed-subject.entity';
import { UserRepository } from './repositories/user.repository';
import { StudentRepository } from './repositories/student.repository';
import { CycleRepository } from './repositories/cycle.repository';
import { SubjectRepository } from './repositories/subject.repository';
import { ScheduleRepository } from './repositories/schedule.repository';
import { EnrollmentRepository } from './repositories/enrollment.repository';
import { EnrollmentSubjectRepository } from './repositories/enrollment-subject.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { TeacherRepository } from './repositories/teacher.repository';
import { ClassroomRepository } from './repositories/classroom.repository';
import { SubjectGroupRepository } from './repositories/subject-group.repository';
import { SystemSettingRepository } from './repositories/system-setting.repository';
import { CareerRepository } from './repositories/career.repository';
import { GradeRepository } from './repositories/grade.repository';
import { LegacyCompletedSubjectRepository } from './repositories/legacy-completed-subject.repository';

const entities = [
  User,
  StudentEntity,
  Cycle,
  Subject,
  Prerequisite,
  Schedule,
  Enrollment,
  EnrollmentSubject,
  Payment,
  Teacher,
  Classroom,
  SubjectGroup,
  SystemSetting,
  Career,
  Grade,
  LegacyCompletedSubject,
];

const repositories = [
  UserRepository,
  StudentRepository,
  CycleRepository,
  SubjectRepository,
  ScheduleRepository,
  EnrollmentRepository,
  EnrollmentSubjectRepository,
  PaymentRepository,
  TeacherRepository,
  ClassroomRepository,
  SubjectGroupRepository,
  SystemSettingRepository,
  CareerRepository,
  GradeRepository,
  LegacyCompletedSubjectRepository,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        database: configService.get<string>('DATABASE_NAME'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        entities,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: repositories,
  exports: [...repositories],
})
export class DatabaseModule {}
