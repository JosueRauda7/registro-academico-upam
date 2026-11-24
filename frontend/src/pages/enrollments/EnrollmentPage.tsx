import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { cyclesApi } from '@/api/cycles.api';
import { subjectsApi } from '@/api/subjects.api';
import { enrollmentsApi } from '@/api/enrollments.api';
import { paymentsApi } from '@/api/payments.api';
import { gradesApi } from '@/api/grades.api';
import { Cycle, Subject, Schedule, PaymentSummary } from '@/types';
import { formatCurrency, getDayName, formatTime } from '@/utils/formatDate';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function EnrollmentPage() {
  const { student } = useAuth();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [approvedSubjectIds, setApprovedSubjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const openCycle = await cyclesApi.findOpenForEnrollment();
      setCycle(openCycle);

      const [allSubjects, allSchedules] = await Promise.all([
        subjectsApi.findAll(),
        subjectsApi.findSchedulesByCycle(openCycle.id),
      ]);

      setSubjects(allSubjects);
      setSchedules(allSchedules);

      try {
        const summary = await paymentsApi.getPaymentSummary(openCycle.id);
        setPaymentSummary(summary);

        const myGrades = await gradesApi.getMy();
        setApprovedSubjectIds(
          new Set(
            myGrades.records
              .filter((r) => r.status === 'approved')
              .map((r) => r.subjectId),
          ),
        );

        if (summary.tuitionPaid) {
          const enrollment = await enrollmentsApi.getMyEnrollment(openCycle.id);
          setEnrolledSubjects(enrollment.subjects || []);
        }
      } catch (err) {
        // Not enrolled yet
      }
    } catch (err: any) {
      toast.error('No hay ciclos abiertos para inscripción');
    } finally {
      setLoading(false);
    }
  };

  const handlePayTuition = async () => {
    if (!cycle) return;
    try {
      const result = await paymentsApi.createTuitionPayment(cycle.id);
      toast.success('Pago de matrícula creado. Procese el pago con Wompi.');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear el pago');
    }
  };

  const handleEnrollSubject = async (subjectId: string, scheduleId: string) => {
    if (!cycle) return;
    setEnrolling(subjectId);
    try {
      const result = await enrollmentsApi.enrollSubject(cycle.id, subjectId, scheduleId);
      toast.success(result.message || 'Materia inscrita exitosamente');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al inscribir materia');
    } finally {
      setEnrolling(null);
    }
  };

  const handleCancelSubject = async (id: string) => {
    try {
      await enrollmentsApi.cancelSubject(id);
      toast.success('Materia cancelada');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al cancelar');
    }
  };

  const handleConfirmEnrollment = async () => {
    if (!cycle) return;
    try {
      await enrollmentsApi.confirmEnrollment(cycle.id);
      toast.success('Inscripción confirmada');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al confirmar');
    }
  };

  const getSchedulesForSubject = (subjectId: string) => {
    return schedules.filter((s) => s.group?.subjectId === subjectId);
  };

  const isSubjectEnrolled = (subjectId: string) => {
    return enrolledSubjects.some(
      (es) => es.subjectId === subjectId && es.status !== 'cancelled',
    );
  };

  const getEnrolledStatus = (subjectId: string) => {
    return enrolledSubjects.find(
      (es) => es.subjectId === subjectId && es.status !== 'cancelled',
    );
  };

  const getPrerequisites = (subject: Subject) =>
    subject.prerequisites?.map(prerequisite => prerequisite.prerequisiteSubject).filter((value): value is Subject => !!value) ?? [];

  const meetsPrerequisite = (subject: Subject) =>
    (subject.prerequisites ?? []).every(prerequisite => approvedSubjectIds.has(prerequisite.prerequisiteSubjectId));

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inscripción de Materias</h1>
            <p className="text-gray-500">
              {cycle ? `${cycle.name} - ${cycle.year}` : 'No hay ciclo disponible'}
            </p>
          </div>
        </div>

        {/* Payment Status */}
        {paymentSummary && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {paymentSummary.tuitionPaid ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : (
                  <AlertCircle className="text-yellow-500" size={24} />
                )}
                <div>
                  <p className="font-semibold">
                    {paymentSummary.tuitionPaid
                      ? 'Matrícula pagada - Puede inscribir materias'
                      : 'Matrícula pendiente - Debe pagar para inscribir materias'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Monto: {formatCurrency(paymentSummary.tuitionAmount)}
                  </p>
                </div>
              </div>
              {!paymentSummary.tuitionPaid && (
                <Button onClick={handlePayTuition}>Pagar Matrícula</Button>
              )}
            </div>
          </Card>
        )}

        {/* Enrolled Subjects */}
        {enrolledSubjects.length > 0 && (
          <Card title="Materias Inscritas">
            <div className="space-y-3">
              {enrolledSubjects.map((es) => (
                <div
                  key={es.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {es.subject?.code} - {es.subject?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {es.schedule && `${getDayName(es.schedule.dayOfWeek)} ${formatTime(es.schedule.startTime)} - ${formatTime(es.schedule.endTime)} | ${es.schedule.group?.classroom?.name || '-'}${es.schedule.group?.teacher ? ` | Prof: ${es.schedule.group.teacher.name}` : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={es.status} />
                    {es.status === 'reserved' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelSubject(es.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {enrolledSubjects.some((es) => es.status === 'reserved') && (
                <Button onClick={handleConfirmEnrollment} className="w-full">
                  Confirmar Inscripción
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Available Subjects */}
        <Card title="Materias Disponibles">
          {paymentSummary?.tuitionPaid ? (
            <div className="space-y-4">
              {subjects.map((subject) => {
                const subjectSchedules = getSchedulesForSubject(subject.id);
                const enrolled = isSubjectEnrolled(subject.id);
                const enrolledStatus = getEnrolledStatus(subject.id);
                const prerequisites = getPrerequisites(subject);
                const prerequisiteMet = meetsPrerequisite(subject);

                return (
                  <div key={subject.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {subject.code} - {subject.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {subject.credits} créditos | Semestre {subject.semester}
                        </p>
                        {prerequisites.length > 0 && (
                          <p
                            className={`mt-1 text-xs ${
                              prerequisiteMet ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {prerequisiteMet
                              ? `Prerrequisitos cumplidos: ${prerequisites.map(p => `${p.code} - ${p.name}`).join(", ")}`
                              : `Requiere prerrequisitos: ${prerequisites.filter(p => !approvedSubjectIds.has(p.id)).map(p => `${p.code} - ${p.name}`).join(", ")}`}
                          </p>
                        )}
                      </div>
                      {enrolled && (
                        <Badge status={enrolledStatus?.status || 'reserved'} />
                      )}
                    </div>
                    {!enrolled && subjectSchedules.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {subjectSchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                          >
                            <div className="text-sm">
                              <span className="font-medium">
                                {getDayName(schedule.dayOfWeek)}
                              </span>{' '}
                              {formatTime(schedule.startTime)} -{' '}
                              {formatTime(schedule.endTime)} |
                              <span className="ml-1 font-medium">
                                {schedule.group?.classroom?.name}
                              </span>
                              {schedule.group?.teacher && (
                                <span className="ml-2 text-gray-600">
                                  Prof: {schedule.group.teacher.name}
                                </span>
                              )}
                              <span className="ml-2 text-gray-500">
                                Grupo {schedule.group?.groupNumber} (
                                {schedule.group?.enrolledCount}/{schedule.group?.capacity} cupos)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              disabled={
                                !prerequisiteMet ||
                                (schedule.group?.enrolledCount ?? 0) >=
                                  (schedule.group?.capacity ?? 0)
                              }
                              loading={enrolling === subject.id}
                              onClick={() =>
                                handleEnrollSubject(subject.id, schedule.id)
                              }
                            >
                              {(schedule.group?.enrolledCount ?? 0) >=
                              (schedule.group?.capacity ?? 0)
                                ? 'Sin cupos'
                                : !prerequisiteMet
                                  ? 'Requiere prerrequisito'
                                  : 'Reservar'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Debe pagar la matrícula para ver las materias disponibles</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
