import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EnrollmentPage } from '@/pages/enrollments/EnrollmentPage';
import { EnrollmentHistoryPage } from '@/pages/enrollments/EnrollmentHistoryPage';
import { PaymentsPage } from '@/pages/payments/PaymentsPage';
import { ColecturiaPage } from '@/pages/payments/ColecturiaPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { CyclesPage } from '@/pages/cycles/CyclesPage';
import { StudentsListPage } from '@/pages/students/StudentsListPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
              <ProtectedRoute>
                <StudentsListPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
