export enum UserRole {
  STUDENT = 'student',
  ADMINISTRATOR = 'administrator',
  COLLECTOR = 'collector',
  ADMINISTRATIVE = 'administrative',
  TEACHER = 'teacher',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Estudiante',
  [UserRole.ADMINISTRATOR]: 'Administrador',
  [UserRole.COLLECTOR]: 'Colector',
  [UserRole.ADMINISTRATIVE]: 'Administrativo',
  [UserRole.TEACHER]: 'Docente',
};

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  TUITION = 'tuition',
  MONTHLY = 'monthly',
  CASH = 'cash',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface SystemSettings {
  logoUrl: string | null;
  primaryColor: string;
  institutionName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  career?: string;
  carnet?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface Student {
  id: string;
  studentCode: string;
  carnet: string;
  career: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  enrollmentYear: number;
  user: User;
  tuitionAmount?: number | null;
  monthlyAmount?: number | null;
}

export interface CreateStudentData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  career?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  enrollmentYear?: number;
}

export interface UpdateStudentData {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  password?: string;
  career?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  enrollmentYear?: number;
}

export interface Cycle {
  id: string;
  name: string;
  year: number;
  semester: number;
  startDate: string;
  endDate: string;
  tuitionAmount: number;
  monthlyAmount: number;
  monthlyCount: number;
  isActive: boolean;
  enrollmentOpen: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  career: string;
  year: number;
  semester: number;
  isActive: boolean;
  prerequisites?: {
    id: string;
    prerequisiteSubjectId: string;
    prerequisiteSubject?: Subject;
  }[];
  prerequisiteSubjectId?: string | null;
}

export type PensumSubjectState = 'completed' | 'enrolled' | 'pending';

export interface PensumSubjectHistory {
  cycleId: string;
  cycleName: string;
  cycleYear: number;
  cycleSemester: number;
  esStatus: string;
  enrollmentStatus: string;
}

export interface PensumSubject extends Subject {
  state?: PensumSubjectState;
  history?: PensumSubjectHistory[];
}

export interface PensumSemester {
  semester: number;
  subjects: PensumSubject[];
}

export interface PensumYear {
  year: number;
  semesters: PensumSemester[];
}

export interface PensumSummary {
  completedSubjects: number;
  enrolledSubjects: number;
  pendingSubjects: number;
  completedCredits: number;
  enrolledCredits: number;
  pendingCredits: number;
}

export interface Career {
  id: string;
  code: string;
  name: string;
  description: string | null;
  years: number;
  semestersPerYear: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CareerInput {
  code: string;
  name: string;
  description?: string;
  years: number;
  semestersPerYear: number;
}

export interface PensumCareerConfig {
  id: string;
  code: string;
  name: string;
  years: number;
  semestersPerYear: number;
  isActive: boolean;
}

export interface Pensum {
  career: string;
  totalSubjects: number;
  totalCredits: number;
  years: PensumYear[];
  student?: PensumSummary;
  careerConfig?: PensumCareerConfig | null;
}

export interface Teacher {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherGroup {
  id: string;
  groupNumber: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  cycleId: string;
  cycleName: string;
  cycleYear: number;
  cycleSemester: number;
  enrolledCount: number;
  gradedCount: number;
  capacity: number;
  classroomName: string;
  cycleEnded: boolean;
}

export interface GradeRecord {
  enrollmentSubjectId: string;
  subjectId: string;
  code: string;
  name: string;
  credits: number;
  career: string;
  score: number;
  status: 'approved' | 'failed';
  gradedAt: string;
  cycleName: string;
  cycleYear: number;
  cycleSemester: number;
  isLegacy?: boolean;
}

export interface GradesSummary {
  totalSubjects: number;
  approvedSubjects: number;
  failedSubjects: number;
  approvedCredits: number;
  failedCredits: number;
  cum: number | null;
}

export interface MyGrades {
  records: GradeRecord[];
  summary: GradesSummary;
}

export interface LegacyCompletedSubject {
  id: string;
  student: {
    id: string;
    carnet: string;
    studentCode: string;
    career: string;
    name: string;
  } | null;
  subjectId: string;
  code: string;
  subjectName: string;
  credits: number;
  year: number | null;
  semester: number | null;
  score: number;
  status: 'approved' | 'failed';
  notes: string | null;
  createdAt: string;
}

export interface LegacySubjectInput {
  studentId: string;
  subjectId: string;
  score: number;
  year?: number | null;
  semester?: number | null;
  notes?: string | null;
}

export interface GroupRosterStudent {
  enrollmentSubjectId: string;
  studentCode: string;
  carnet: string;
  studentName: string;
  score: number | null;
  status: 'approved' | 'failed' | null;
  gradedAt: string | null;
}

export interface GroupRoster {
  group: {
    id: string;
    groupNumber: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    cycleName: string;
    cycleEnded: boolean;
  };
  students: GroupRosterStudent[];
}

export interface Classroom {
  id: string;
  name: string;
  building: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectGroup {
  id: string;
  subjectId: string;
  cycleId: string;
  teacherId: string | null;
  classroomId: string;
  groupNumber: number;
  capacity: number;
  enrolledCount: number;
  isActive: boolean;
  subject?: Subject;
  cycle?: Cycle;
  teacher?: Teacher;
  classroom?: Classroom;
  schedules?: Schedule[];
}

export interface Schedule {
  id: string;
  groupId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  group?: SubjectGroup;
  subject?: Subject;
}

export interface Enrollment {
  id: string;
  studentId: string;
  cycleId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  tuitionPaid: boolean;
  student?: Student;
  cycle?: Cycle;
  subjects?: EnrollmentSubject[];
}

export interface EnrollmentSubject {
  id: string;
  enrollmentId: string;
  subjectId: string;
  scheduleId: string;
  status: string;
  reservedAt: string;
  subject?: Subject;
  schedule?: Schedule;
}

export interface Payment {
  id: string;
  studentId: string;
  cycleId: string;
  amount: number;
  paymentDate: string | null;
  paymentMethod: string;
  wompiTransactionId: string | null;
  bankName: string | null;
  bankTransactionCode: string | null;
  receiptImageUrl: string | null;
  status: PaymentStatus;
  type: PaymentType;
  month: number | null;
  description: string;
  reference: string;
  createdAt: string;
  student?: Student;
  cycle?: Cycle;
}

export interface PaymentSummary {
  cycle: string;
  tuitionAmount: number;
  tuitionPaid: boolean;
  monthlyAmount: number;
  monthlyCount: number;
  monthlyPayments: {
    month: number;
    amount: number;
    paid: boolean;
    paymentDate: string | null;
    reference: string | null;
  }[];
  totalPaid: number;
  totalPending: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface AuthResponse {
  user: User;
  student: Student | null;
  teacher: {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
  } | null;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  career?: string;
  phone?: string;
}
