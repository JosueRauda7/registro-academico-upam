import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { pensumApi } from '@/api/pensum.api';
import { Pensum, PensumSubject } from '@/types';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle2, Clock, GraduationCap } from 'lucide-react';

const STATE_LABELS = {
  completed: 'Cursada',
  enrolled: 'Inscrita',
  pending: 'Pendiente',
};

const STATE_BADGES = {
  completed: 'active' as const,
  enrolled: 'pending' as const,
  pending: 'failed' as const,
};

function stateSummary(subject: PensumSubject): string {
  if (!subject.history || subject.history.length === 0) return '';
  const cycleNames = subject.history.map((h) => h.cycleName);
  return cycleNames.join(', ');
}

export function MyPensumPage() {
  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setPensum(await pensumApi.get());
    } catch {
      toast.error('Error al cargar el pensum');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!pensum) return null;

  const summary = pensum.student;
  const progress =
    pensum.totalCredits > 0
      ? Math.round(((summary?.completedCredits || 0) / pensum.totalCredits) * 100)
      : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Pensum</h1>
          <p className="text-gray-500">
            Plan de estudios de <strong>{pensum.career}</strong> - total {pensum.totalSubjects} materias, {pensum.totalCredits} creditos
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cursadas</p>
                <p className="text-lg font-semibold">
                  {summary.completedSubjects} <span className="text-sm font-normal text-gray-400">({summary.completedCredits} cr)</span>
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <BookOpen className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inscritas</p>
                <p className="text-lg font-semibold">
                  {summary.enrolledSubjects} <span className="text-sm font-normal text-gray-400">({summary.enrolledCredits} cr)</span>
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-lg font-semibold">
                  {summary.pendingSubjects} <span className="text-sm font-normal text-gray-400">({summary.pendingCredits} cr)</span>
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-upam-primary">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Avance</p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-upam-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-sm font-semibold">{progress}%</p>
              </div>
            </Card>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-500">Leyenda:</span>
          <Badge status="active" label="Cursada" />
          <Badge status="pending" label="Inscrita" />
          <Badge status="failed" label="Pendiente" />
        </div>

        <div className="space-y-8">
          {pensum.years.map((yr) => (
            <div key={yr.year}>
              <h2 className="mb-3 text-lg font-bold text-gray-800">Ano {yr.year}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {yr.semesters.map((sem) => (
                  <Card key={sem.semester} title={`Semestre ${sem.semester}`}>
                    <div className="space-y-2">
                      {sem.subjects.length === 0 && (
                        <p className="py-4 text-center text-sm text-gray-400">Sin materias</p>
                      )}
                      {sem.subjects.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">
                              <span className="text-upam-primary">{s.code}</span> - {s.name}
                            </p>
                            <p className="text-xs text-gray-500">{s.credits} creditos</p>
                            {s.state && s.state !== 'pending' && stateSummary(s) && (
                              <p className="mt-1 text-xs text-gray-400">
                                {s.state === 'completed' ? 'Cursada en' : 'Inscrita en'} {stateSummary(s)}
                              </p>
                            )}
                          </div>
                          <Badge status={STATE_BADGES[s.state || 'pending']} label={STATE_LABELS[s.state || 'pending']} />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}