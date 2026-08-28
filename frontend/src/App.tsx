import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserRole } from '@/types';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EnrollmentPage } from '@/pages/enrollments/EnrollmentPage';
import { EnrollmentHistoryPage } from '@/pages/enrollments/EnrollmentHistoryPage';
import { PaymentsPage } from '@/pages/payments/PaymentsPage';
import { ColecturiaPage } from '@/pages/payments/ColecturiaPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { CyclesPage } from '@/pages/cycles/CyclesPage';
import { StudentsListPage } from '@/pages/students/StudentsListPage';
import { PlanningPage } from '@/pages/planning/PlanningPage';
import { SchedulePage } from '@/pages/schedule/SchedulePage';
import { SubjectsPage } from '@/pages/subjects/SubjectsPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { PensumPage } from '@/pages/pensum/PensumPage';
import { MyPensumPage } from '@/pages/pensum/MyPensumPage';
import { CareersPage } from '@/pages/careers/CareersPage';
import { TeacherGroupsPage } from '@/pages/grades/TeacherGroupsPage';
import { GradeEntryPage } from '@/pages/grades/GradeEntryPage';
import { LegacySubjectsPage } from '@/pages/legacy-subjects/LegacySubjectsPage';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/cambiar-contrasena"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inscripcion"
            element={
              <ProtectedRoute>
                <EnrollmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-materias"
            element={
              <ProtectedRoute>
                <EnrollmentHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <EnrollmentHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagos"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/colecturia"
            element={
              <ProtectedRoute>
                <ColecturiaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ciclos"
            element={
              <ProtectedRoute>
                <CyclesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiantes"
            element={
              <ProtectedRoute roles={[UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE]}>
                <StudentsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materias-previas"
            element={
              <ProtectedRoute roles={[UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE]}>
                <LegacySubjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planificacion"
            element={
              <ProtectedRoute>
                <PlanningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/horario"
            element={
              <ProtectedRoute>
                <SchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-pensum"
            element={
              <ProtectedRoute>
                <MyPensumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pensum"
            element={
              <ProtectedRoute>
                <PensumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carreras"
            element={
              <ProtectedRoute>
                <CareersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notas-docente"
            element={
              <ProtectedRoute roles={[UserRole.TEACHER, UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE]}>
                <TeacherGroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notas-docente/:groupId"
            element={
              <ProtectedRoute roles={[UserRole.TEACHER, UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE]}>
                <GradeEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materias"
            element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
