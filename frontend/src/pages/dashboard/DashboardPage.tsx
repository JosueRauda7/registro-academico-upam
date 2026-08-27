import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { paymentsApi } from '@/api/payments.api';
import { enrollmentsApi } from '@/api/enrollments.api';
import { cyclesApi } from '@/api/cycles.api';
import { formatCurrency } from '@/utils/formatDate';
import {
  CreditCard,
  BookOpen,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
} from 'lucide-react';

export function DashboardPage() {
  const { user, student, hasRole } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [currentCycle, setCurrentCycle] = useState<any>(null);

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
  };

  const isStudent = hasRole(UserRole.STUDENT);

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
              : `Panel de ${user?.role === UserRole.ADMINISTRATOR ? 'Administrador' : user?.role === UserRole.COLLECTOR ? 'Colector' : 'Administrativo'}`}
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

          <Card title="Informacion del Sistema">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Institucion</span>
                <span className="font-medium">Universidad Panamericana de El Salvador</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Sistema</span>
                <span className="font-medium">Registro Academico v1.0</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Rol</span>
                <span className="font-medium capitalize">{user?.role}</span>
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
