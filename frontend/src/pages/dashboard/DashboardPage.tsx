import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { paymentsApi } from '@/api/payments.api';
import { enrollmentsApi } from '@/api/enrollments.api';
import { cyclesApi } from '@/api/cycles.api';
import { gradesApi } from '@/api/grades.api';
import { formatCurrency } from '@/utils/formatDate';
import {
  CreditCard,
  BookOpen,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  GraduationCap,
} from 'lucide-react';

export function DashboardPage() {
  const { user, student, teacher, hasRole, roleLabel } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [myGrades, setMyGrades] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cycles = await cyclesApi.findActive();
      if (cycles.length > 0) {
        setCurrentCycle(cycles[0]);
      }
    } catch (err) {
      // Cycle might not be available
    }

    if (hasRole(UserRole.STUDENT)) {
      try {
        const grades = await gradesApi.getMy();
        setMyGrades(grades);
      } catch (err) {
        // Notas might not be available
      }
    }
  };

  const isStudent = hasRole(UserRole.STUDENT);
  const isTeacher = hasRole(UserRole.TEACHER);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-500">
            {isStudent
              ? `Panel del estudiante - ${student?.career || ''}`
              : isTeacher
                ? `Panel del docente - ${teacher?.department || ''}`
                : `Panel de ${roleLabel}`}
          </p>
        </div>

        {currentCycle && (
          <div className="rounded-lg bg-upam-primary p-6 text-white">
            <div className="flex items-center gap-3">
              <Calendar size={24} />
              <div>
                <h3 className="text-lg font-semibold">{currentCycle.name}</h3>
                <p className="text-blue-200">
                  {currentCycle.startDate} - {currentCycle.endDate} | Inscripcion{' '}
                  {currentCycle.enrollmentOpen ? 'Abierta' : 'Cerrada'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isStudent && (
            <>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <CreditCard className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Codigo</p>
                  <p className="font-semibold">{student?.studentCode}</p>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <BookOpen className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Carnet</p>
                  <p className="font-semibold">{student?.carnet}</p>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <TrendingUp className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CUM</p>
                  <p className="font-semibold">
                    {myGrades?.summary?.cum != null ? myGrades.summary.cum.toFixed(2) : '-'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {myGrades?.summary?.totalSubjects ?? 0} materias calificadas
                  </p>
                </div>
              </Card>
            </>
          )}

          {isTeacher && (
            <>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Departamento</p>
                  <p className="font-semibold">{teacher?.department || '-'}</p>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <GraduationCap className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grupos a cargo</p>
                  <a href="/notas-docente" className="font-semibold text-upam-primary hover:underline">
                    Gestionar notas
                  </a>
                </div>
              </Card>
            </>
          )}

          {(hasRole(UserRole.ADMINISTRATOR, UserRole.COLLECTOR)) && (
            <>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <DollarSign className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Matricula Ciclo</p>
                  <p className="font-semibold">
                    {currentCycle ? formatCurrency(currentCycle.tuitionAmount) : '-'}
                  </p>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mensualidad</p>
                  <p className="font-semibold">
                    {currentCycle ? formatCurrency(currentCycle.monthlyAmount) : '-'}
                  </p>
                </div>
              </Card>
              <Card className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <Users className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mensualidades</p>
                  <p className="font-semibold">{currentCycle?.monthlyCount || 0} meses</p>
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Acciones Rapidas">
            <div className="space-y-3">
              {isStudent && currentCycle?.enrollmentOpen && (
                <>
                  <a
                    href="/inscripcion"
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">Inscribir Materias</p>
                    <p className="text-sm text-gray-500">
                      Reserva cupo en las materias del ciclo actual
                    </p>
                  </a>
                  <a
                    href="/pagos"
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">Realizar Pagos</p>
                    <p className="text-sm text-gray-500">
                      Paga matricula o mensualidades del ciclo
                    </p>
                  </a>
                </>
              )}
              {isStudent && (
                <a
                  href="/mi-pensum"
                  className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">Mi Pensum y Notas</p>
                  <p className="text-sm text-gray-500">
                    Consulta el avance de tu carrera y tus calificaciones
                  </p>
                </a>
              )}
              {isTeacher && (
                <>
                  <a
                    href="/notas-docente"
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">Registrar Notas</p>
                    <p className="text-sm text-gray-500">
                      Califica a los estudiantes de tus grupos
                    </p>
                  </a>
                  <a
                    href="/reportes"
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">Reportes por Grupo</p>
                    <p className="text-sm text-gray-500">
                      Descarga la lista de estudiantes con notas en Excel
                    </p>
                  </a>
                </>
              )}
              {hasRole(UserRole.ADMINISTRATOR) && (
                <>
                  <a
                    href="/ciclos"
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">Gestionar Ciclos</p>
                    <p className="text-sm text-gray-500">
                      Abrir/cerrar inscripciones, crear ciclos
                    </p>
                  </a>
                  <a
                    href="/estudiantes"
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">Gestionar Estudiantes</p>
                    <p className="text-sm text-gray-500">
                      Ver y administrar estudiantes
                    </p>
                  </a>
                </>
              )}
              {hasRole(UserRole.COLLECTOR) && (
                <a
                  href="/pagos"
                  className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">Ver Pagos</p>
                  <p className="text-sm text-gray-500">
                    Consultar pagos y recaudacion
                  </p>
                </a>
              )}
              <a
                href="/reportes"
                className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">Reportes</p>
                <p className="text-sm text-gray-500">
                  Genera reportes en Excel y PDF
                </p>
              </a>
            </div>
          </Card>

          <Card title="Mi Cuenta">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Nombre</span>
                <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Rol</span>
                <span className="font-medium">{roleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Correo</span>
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
