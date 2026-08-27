export enum UserRole {
  STUDENT = 'student',
  ADMINISTRATOR = 'administrator',
  COLLECTOR = 'collector',
  ADMINISTRATIVE = 'administrative',
}

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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
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
}

export interface Schedule {
  id: string;
  subjectId: string;
  cycleId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  capacity: number;
  enrolledCount: number;
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
