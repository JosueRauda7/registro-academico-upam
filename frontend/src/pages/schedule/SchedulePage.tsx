import { WEEK_DAYS as DAYS, subjectScheduleBlocks, timetableBlocks, timetableRange, toMinutes } from './schedule-blocks';
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

const HOUR_HEIGHT = 56;

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

  const blocks = timetableBlocks(activeSubjects);
  const { startHour, endHour } = timetableRange(blocks.map(block => block.schedule));
  const gridHeight = (endHour - startHour) * HOUR_HEIGHT;
  const hourRows = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);

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
                  <div className="flex border-t border-gray-100" style={{ height: gridHeight }}>
                    <div className="relative w-14 shrink-0">
                      {hourRows.map(hour => <div key={hour} className="absolute right-2 text-xs text-gray-400" style={{ top: (hour - startHour) * HOUR_HEIGHT }}>
                        {formatTime(`${hour % 24}:00`)}
                      </div>)}
                    </div>
                    {DAYS.map(day => <div key={day} className="relative min-w-0 flex-1 border-l border-gray-100">
                      {hourRows.map(hour => <div key={hour} className="absolute inset-x-0 border-t border-gray-100" style={{ top: (hour - startHour) * HOUR_HEIGHT }} />)}
                      {blocks.filter(block => block.schedule.dayOfWeek === day).map(({ subject: es, schedule: s }) => {
                        const group = es.schedule?.group;
                        return <div
                          key={`${es.id}:${s.id}`}
                          className="absolute inset-x-1 overflow-hidden rounded-md border-l-4 bg-blue-50 px-2 py-1"
                          title={`${es.subject?.name || ''} · ${getDayName(day)} ${formatTime(s.startTime)} - ${formatTime(s.endTime)}`}
                          style={{
                            borderColor: 'var(--upam-primary, #1e3a8a)',
                            top: ((toMinutes(s.startTime) - startHour * 60) / 60) * HOUR_HEIGHT,
                            height: Math.max(((toMinutes(s.endTime) - toMinutes(s.startTime)) / 60) * HOUR_HEIGHT - 4, 24),
                          }}
                        >
                          <p className="truncate text-xs font-semibold text-gray-900">{es.subject?.code} {group?.groupNumber ? `(G${group.groupNumber})` : ''}</p>
                          <p className="truncate text-[11px] text-gray-600">{formatTime(s.startTime)} - {formatTime(s.endTime)}</p>
                          <p className="truncate text-[11px] text-gray-500">{group?.classroom?.name} | {group?.teacher?.name || 'Sin docente'}</p>
                        </div>;
                      })}
                    </div>)}
                  </div>
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
                      {subjectScheduleBlocks(es).map(schedule => <p key={schedule.id} className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {getDayName(schedule.dayOfWeek)} {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </p>)}
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