import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { StudentEntity } from '../entities/student.entity';
import { Cycle } from '../entities/cycle.entity';
import { Subject } from '../entities/subject.entity';
import { Prerequisite } from '../entities/prerequisite.entity';
import { Schedule } from '../entities/schedule.entity';
import { UserRole } from '../../../domain/enums/role.enum';
import { DayOfWeek } from '../../../domain/enums/day-of-week.enum';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'upam_academico',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  entities: [User, StudentEntity, Cycle, Subject, Prerequisite, Schedule],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const userRepo = dataSource.getRepository(User);
  const studentRepo = dataSource.getRepository(StudentEntity);
  const cycleRepo = dataSource.getRepository(Cycle);
  const subjectRepo = dataSource.getRepository(Subject);
  const prereqRepo = dataSource.getRepository(Prerequisite);
  const scheduleRepo = dataSource.getRepository(Schedule);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await userRepo.save({
    email: 'admin@upam.edu.sv',
    passwordHash: adminPassword,
    firstName: 'Administrador',
    lastName: 'UPAM',
    role: UserRole.ADMINISTRATOR,
    isActive: true,
  });
  console.log('Admin user created');

  // Create collector user
  const collectorPassword = await bcrypt.hash('colector123', 10);
  await userRepo.save({
    email: 'colector@upam.edu.sv',
    passwordHash: collectorPassword,
    firstName: 'Maria',
    lastName: 'González',
    role: UserRole.COLLECTOR,
    isActive: true,
  });

  // Create administrative user
  const adminStaffPassword = await bcrypt.hash('adminstaff123', 10);
  await userRepo.save({
    email: 'administrativo@upam.edu.sv',
    passwordHash: adminStaffPassword,
    firstName: 'Carlos',
    lastName: 'Ramírez',
    role: UserRole.ADMINISTRATIVE,
    isActive: true,
  });

  // Create test student
  const studentPassword = await bcrypt.hash('estudiante123', 10);
  const studentUser = await userRepo.save({
    email: 'estudiante@upam.edu.sv',
    passwordHash: studentPassword,
    firstName: 'Josué',
    lastName: 'Rauda',
    role: UserRole.STUDENT,
    isActive: true,
  });

  await studentRepo.save({
    userId: studentUser.id,
    studentCode: 'UPAM-2026-0001',
    carnet: 'LR021501',
    career: 'Ingeniería en Sistemas',
    enrollmentYear: 2026,
    phone: '7012-3456',
    address: 'San Salvador, El Salvador',
    dateOfBirth: new Date('2000-05-15'),
  });
  console.log('Student user created');

  // Create cycle
  const cycle = await cycleRepo.save({
    name: 'Ciclo I 2026',
    year: 2026,
    semester: 1,
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-05-30'),
    tuitionAmount: 150.0,
    monthlyAmount: 120.0,
    monthlyCount: 4,
    isActive: true,
    enrollmentOpen: true,
  });
  console.log('Cycle created');

  // Create subjects for Ingeniería en Sistemas
  const subjects = [
    { code: 'MAT101', name: 'Matemática I', credits: 4, year: 1, semester: 1 },
    { code: 'INF101', name: 'Introducción a la Programación', credits: 4, year: 1, semester: 1 },
    { code: 'FIS101', name: 'Física I', credits: 4, year: 1, semester: 1 },
    { code: 'ING101', name: 'Inglés I', credits: 3, year: 1, semester: 1 },
    { code: 'MAT102', name: 'Matemática II', credits: 4, year: 1, semester: 2 },
    { code: 'INF102', name: 'Programación II', credits: 4, year: 1, semester: 2 },
    { code: 'FIS102', name: 'Física II', credits: 4, year: 1, semester: 2 },
    { code: 'ING102', name: 'Inglés II', credits: 3, year: 1, semester: 2 },
    { code: 'MAT201', name: 'Matemática III', credits: 4, year: 2, semester: 1 },
    { code: 'INF201', name: 'Estructuras de Datos', credits: 4, year: 2, semester: 1 },
    { code: 'INF202', name: 'Base de Datos', credits: 4, year: 2, semester: 2 },
    { code: 'INF203', name: 'Redes de Computadoras', credits: 3, year: 2, semester: 2 },
  ];

  const createdSubjects: Subject[] = [];
  for (const s of subjects) {
    const subject = await subjectRepo.save({
      ...s,
      career: 'Ingeniería en Sistemas',
      isActive: true,
    });
    createdSubjects.push(subject);
  }
  console.log('Subjects created');

  // Create prerequisites
  const prerequisites = [
    { subjectId: createdSubjects[4].id, prerequisiteSubjectId: createdSubjects[0].id }, // MAT201 requires MAT101
    { subjectId: createdSubjects[5].id, prerequisiteSubjectId: createdSubjects[1].id }, // INF102 requires INF101
    { subjectId: createdSubjects[8].id, prerequisiteSubjectId: createdSubjects[4].id }, // MAT201 requires MAT102
    { subjectId: createdSubjects[9].id, prerequisiteSubjectId: createdSubjects[5].id }, // INF201 requires INF102
  ];

  for (const p of prerequisites) {
    await prereqRepo.save(p);
  }
  console.log('Prerequisites created');

  // Create schedules
  const scheduleData = [
    { subjectId: createdSubjects[0].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '07:00', endTime: '09:00', classroom: 'A-101' },
    { subjectId: createdSubjects[0].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '07:00', endTime: '09:00', classroom: 'A-101' },
    { subjectId: createdSubjects[1].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '11:00', classroom: 'Lab-1' },
    { subjectId: createdSubjects[1].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '11:00', classroom: 'Lab-1' },
    { subjectId: createdSubjects[2].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '11:00', endTime: '13:00', classroom: 'A-201' },
    { subjectId: createdSubjects[2].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '11:00', endTime: '13:00', classroom: 'A-201' },
    { subjectId: createdSubjects[3].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: '07:00', endTime: '10:00', classroom: 'A-301' },
    { subjectId: createdSubjects[4].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '07:00', endTime: '09:00', classroom: 'A-102' },
    { subjectId: createdSubjects[4].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '07:00', endTime: '09:00', classroom: 'A-102' },
    { subjectId: createdSubjects[5].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '16:00', classroom: 'Lab-2' },
    { subjectId: createdSubjects[5].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '16:00', classroom: 'Lab-2' },
    { subjectId: createdSubjects[9].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '14:00', endTime: '16:00', classroom: 'Lab-3' },
    { subjectId: createdSubjects[9].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '16:00', classroom: 'Lab-3' },
  ];

  for (const s of scheduleData) {
    await scheduleRepo.save({
      ...s,
      cycleId: cycle.id,
      capacity: 40,
      enrolledCount: 0,
    });
  }
  console.log('Schedules created');

  console.log('\n=== Seed completed ===');
  console.log('Admin: admin@upam.edu.sv / admin123');
  console.log('Student: estudiante@upam.edu.sv / estudiante123');
  console.log('Collector: colector@upam.edu.sv / colector123');
  console.log('Administrative: administrativo@upam.edu.sv / adminstaff123');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
