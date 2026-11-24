export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentEntity {
  id: string;
  userId: string;
  user?: UserEntity;
  studentCode: string;
  carnet: string;
  career: string;
  enrollmentYear: number;
  tuitionAmount?: number | null;
  monthlyAmount?: number | null;
  phone: string;
  address: string;
  dateOfBirth: Date;
}

export interface CycleEntity {
  id: string;
  name: string;
  year: number;
  semester: number;
  startDate: Date;
  endDate: Date;
  tuitionAmount: number;
  monthlyAmount: number;
  monthlyCount: number;
  isActive: boolean;
  enrollmentOpen: boolean;
}

export interface SubjectEntity {
  id: string;
  code: string;
  name: string;
  credits: number;
  career: string;
  year: number;
  semester: number;
  isActive: boolean;
}

export interface PrerequisiteEntity {
  id: string;
  subjectId: string;
  prerequisiteSubjectId: string;
  subject?: SubjectEntity;
  prerequisiteSubject?: SubjectEntity;
}

export interface ScheduleEntity {
  id: string;
  subjectId: string;
  cycleId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  capacity: number;
  enrolledCount: number;
  subject?: SubjectEntity;
  cycle?: CycleEntity;
}

export interface EnrollmentEntity {
  id: string;
  studentId: string;
  cycleId: string;
  status: string;
  enrolledAt: Date;
  tuitionPaid: boolean;
  student?: StudentEntity;
  cycle?: CycleEntity;
  subjects?: EnrollmentSubjectEntity[];
}

export interface EnrollmentSubjectEntity {
  id: string;
  enrollmentId: string;
  subjectId: string;
  scheduleId: string;
  status: string;
  reservedAt: Date;
  enrollment?: EnrollmentEntity;
  subject?: SubjectEntity;
  schedule?: ScheduleEntity;
}

export interface PaymentEntity {
  id: string;
  studentId: string;
  cycleId: string;
  amount: number;
  paymentDate: Date | null;
  paymentMethod: string;
  wompiTransactionId: string | null;
  status: string;
  type: string;
  month: number | null;
  description: string;
  reference: string;
  createdAt: Date;
  student?: StudentEntity;
  cycle?: CycleEntity;
}
