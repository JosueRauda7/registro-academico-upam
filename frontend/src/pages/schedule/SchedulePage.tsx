import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cyclesApi } from '@/api/cycles.api';
import { enrollmentsApi } from '@/api/enrollments.api';
import { Cycle, Enrollment } from '@/types';
import { getDayName, formatTime } from '@/utils/formatDate';
import { CalendarDays, Clock, DoorOpen, Users } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const START_HOUR = 6;
const END_HOUR = 20;
const HOUR_HEIGHT = 56;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function SchedulePage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycleLoading, setCycleLoading] = useState(false);

  useEffect(() => {
    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) loadEnrollment();
  }, [selectedCycle]);

  const loadCycles = async () => {
    try {
      const data = await cyclesApi.findAll();
      setCycles(data);
      if (data.length > 0) setSelectedCycle(data[0].id);
    } catch {
      // no cycles
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollment = async () => {
    try {
      setCycleLoading(true);
      const data = await enrollmentsApi.getMyEnrollment(selectedCycle);
      setEnrollment(data);
    } catch {
      setEnrollment(null);
    } finally {
      setCycleLoading(false);
    }
  };

  const activeSubjects = (enrollment?.subjects || []).filter(
    (es) => es.status !== 'cancelled' && es.schedule,
  );

  const totalCredits = activeSubjects.reduce(
    (sum, es) => sum + (es.subject?.credits || 0),
    0,
  );

  const currentCycle = cycles.find((c) => c.id === selectedCycle);

  const hourRows: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hourRows.push(h);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Horario</h1>
          <p className="text-gray-500">Horario de clases por ciclo</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchableSelect
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name} - {c.year}</option>
            ))}
          </SearchableSelect>
          {currentCycle && (
            <Badge
              status={currentCycle.enrollmentOpen ? 'pending' : 'active'}
              label={currentCycle.enrollmentOpen ? 'Pendiente de confirmación' : 'Confirmado'}
            />
          )}
          <span className="text-sm text-gray-500">
            {activeSubjects.length} materias · {totalCredits} créditos
          </span>
        </div>

        {cycleLoading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        )}

        {!cycleLoading && activeSubjects.length === 0 && (
          <Card>
            <p className="py-8 text-center text-gray-500">
              No tiene materias inscritas en este ciclo. Inscriba materias para ver su horario.
            </p>
          </Card>
        )}

        {!cycleLoading && activeSubjects.length > 0 && (
          <>
            {/* Weekly grid */}
            <Card title={`Horario semanal - ${currentCycle?.name || ''}`}>
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="flex">
                    <div className="w-14 shrink-0" />
                    {DAYS.map((day) => (
                      <div key={day} className="flex-1 border-l border-gray-100 px-2 py-2 text-center text-sm font-semibold text-gray-700">
                        {getDayName(day)}
                      </div>
                    ))}
                  </div>
                  {hourRows.map((h) => {
                    const label = `${h}:00`;
                    const start = (h - START_HOUR) * HOUR_HEIGHT;
                    return (
                      <div key={h} className="relative flex border-t border-gray-100">
                        <div className="w-14 shrink-0 py-1 pr-2 text-right text-xs text-gray-400">
                          {formatTime(`${h}:00`)}
                        </div>
                        <div className="absolute left-14 right-0" style={{ top: start / HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                          {DAYS.map((day) => {
                            const cards = activeSubjects.filter((es) => es.schedule?.dayOfWeek === day);
                            return (
                              <div key={day} className="absolute top-0 h-full w-[16.666%] border-l border-gray-100" style={{ left: `${DAYS.indexOf(day) * 16.666}%` }}>
                                {cards.map((es) => {
                                  const s = es.schedule!;
                                  const startMin = toMinutes(s.startTime);
                                  const endMin = toMinutes(s.endTime);
                                  return (
                                    <div
                                      key={es.id}
                                      className="absolute inset-x-1 overflow-hidden rounded-md border-l-4 bg-blue-50 px-2 py-1"
                                      style={{
                                        borderColor: 'var(--upam-primary, #1e3a8a)',
                                        backgroundColor: '#eff6ff',
                                        top: ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT,
                                        height: Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 4, 24),
                                      }}
                                    >
                                      <p className="truncate text-xs font-semibold text-gray-900">
                                        {es.subject?.code} {es.schedule?.group?.groupNumber ? `(G${es.schedule.group.groupNumber})` : ''}
                                      </p>
                                      <p className="truncate text-[11px] text-gray-600">
                                        {formatTime(s.startTime)} - {formatTime(s.endTime)}
                                      </p>
                                      <p className="truncate text-[11px] text-gray-500">
                                        {es.schedule?.group?.classroom?.name} | {es.schedule?.group?.teacher?.name || 'Sin docente'}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Subject detail list */}
            <Card title="Detalle de materias">
              <div className="space-y-3">
                {activeSubjects.map((es) => (
                  <div key={es.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {es.subject?.code} - {es.subject?.name}
                        {es.schedule?.group?.groupNumber && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            Grupo {es.schedule.group.groupNumber}
                          </span>
                        )}
                      </p>
                      <span className="text-sm font-medium text-upam-primary">
                        {es.subject?.credits} créditos
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {getDayName(es.schedule?.dayOfWeek || '')} {formatTime(es.schedule?.startTime || '')} - {formatTime(es.schedule?.endTime || '')}
                      </p>
                      <p className="flex items-center gap-2">
                        <DoorOpen size={14} className="text-gray-400" />
                        Salón: {es.schedule?.group?.classroom?.name || '-'}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        Docente: {es.schedule?.group?.teacher?.name || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {!cycleLoading && enrollment && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays size={16} />
            Estado: <Badge status="info" label={enrollment.status} />
          </p>
        )}
      </div>
    </Layout>
  );
}