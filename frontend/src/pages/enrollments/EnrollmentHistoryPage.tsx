import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { enrollmentsApi } from '@/api/enrollments.api';
import { Enrollment } from '@/types';
import { formatDate, getDayName, formatTime, formatCurrency } from '@/utils/formatDate';
import toast from 'react-hot-toast';

export function EnrollmentHistoryPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const data = await enrollmentsApi.getMyEnrollments();
      setEnrollments(data);
    } catch (err) {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Inscripciones</h1>
          <p className="text-gray-500">Consulta tus inscripciones anteriores</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">No hay inscripciones registradas</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {enrollment.cycle?.name || 'Ciclo'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Inscrito: {formatDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge status={enrollment.status} />
                    {enrollment.tuitionPaid && <Badge status="completed" />}
                  </div>
                </div>

                {enrollment.subjects && enrollment.subjects.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Materias:</p>
                    <div className="space-y-2">
                      {enrollment.subjects.map((es) => (
                        <div
                          key={es.id}
                          className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm"
                        >
                          <div>
                            <span className="font-medium">
                              {es.subject?.code} - {es.subject?.name}
                            </span>
                            {es.schedule && (
                              <span className="ml-2 text-gray-500">
                                {getDayName(es.schedule.dayOfWeek)}{' '}
                                {formatTime(es.schedule.startTime)} -{' '}
                                {formatTime(es.schedule.endTime)} |{' '}
                                {es.schedule.group?.classroom?.name || '-'}
                              </span>
                            )}
                          </div>
                          <Badge status={es.status} />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Total creditos:{' '}
                      {enrollment.subjects.reduce(
                        (sum, es) => sum + (es.subject?.credits || 0),
                        0,
                      )}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
