import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { gradesApi } from '@/api/grades.api';
import { GroupRoster } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Save, Lock } from 'lucide-react';

export function GradeEntryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [roster, setRoster] = useState<GroupRoster | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await gradesApi.getGroupRoster(groupId!);
      setRoster(data);
      const init: Record<string, string> = {};
      data.students.forEach((s) => {
        init[s.enrollmentSubjectId] = s.score !== null ? String(s.score) : '';
      });
      setScores(init);
    } catch {
      toast.error('Error al cargar las notas del grupo');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const blob = await gradesApi.exportGroup(groupId!);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'notas-grupo.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al generar el archivo Excel');
    }
  };

  const handleSave = async () => {
    if (!roster) return;
    const entries = roster.students.map((s) => {
      const raw = scores[s.enrollmentSubjectId]?.trim();
      return { enrollmentSubjectId: s.enrollmentSubjectId, score: raw === '' ? null : Number(raw) };
    });

    const invalid = entries.find(
      (e) => e.score !== null && (Number.isNaN(e.score) || e.score! < 0 || e.score! > 100),
    );
    if (invalid) {
      toast.error('Todas las notas deben ser numeros entre 0 y 100');
      return;
    }

    setSaving(true);
    try {
      const withScore = entries.filter((e) => e.score !== null) as {
        enrollmentSubjectId: string;
        score: number;
      }[];
      if (withScore.length === 0) {
        toast.error('Ingrese al menos una nota');
        return;
      }
      await gradesApi.saveGrades(groupId!, withScore);
      toast.success('Notas guardadas exitosamente');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  const cycleEnded = roster?.group.cycleEnded ?? false;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/notas-docente"
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {roster?.group.subjectCode} - {roster?.group.subjectName}
              </h1>
              <p className="text-gray-500">
                {roster?.group.cycleName} | Grupo {roster?.group.groupNumber} |{' '}
                {roster?.group.credits} creditos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel}>
              <Download size={16} className="mr-2" /> Excel
            </Button>
            {!cycleEnded && (
              <Button loading={saving} onClick={handleSave}>
                <Save size={16} className="mr-2" /> Guardar Notas
              </Button>
            )}
          </div>
        </div>

        {cycleEnded && (
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            <Lock size={18} />
            El ciclo academico ha finalizado. Las notas estan bloqueadas y no pueden modificarse.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : !roster || roster.students.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">
              No hay estudiantes registrados en este grupo.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Carnet</th>
                    <th className="px-4 py-3">Codigo</th>
                    <th className="px-4 py-3">Estudiante</th>
                    <th className="px-4 py-3">Nota (0-100)</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.students.map((s) => {
                    const raw = scores[s.enrollmentSubjectId]?.trim();
                    const num = raw === '' ? null : Number(raw);
                    const status =
                      num === null ? null : num >= 60 ? 'approved' : 'failed';
                    return (
                      <tr key={s.enrollmentSubjectId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{s.carnet}</td>
                        <td className="px-4 py-3">{s.studentCode}</td>
                        <td className="px-4 py-3">{s.studentName}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            disabled={cycleEnded}
                            value={scores[s.enrollmentSubjectId] ?? ''}
                            onChange={(e) =>
                              setScores((prev) => ({
                                ...prev,
                                [s.enrollmentSubjectId]: e.target.value,
                              }))
                            }
                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {status === 'approved' && <Badge status="active" label="Aprobada" />}
                          {status === 'failed' && <Badge status="failed" label="Reprobada" />}
                          {status === null && <Badge status="pending" label="Sin nota" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}