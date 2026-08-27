import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { gradesApi } from '@/api/grades.api';
import { TeacherGroup } from '@/types';
import toast from 'react-hot-toast';
import { BookOpen, ChevronRight, AlertTriangle } from 'lucide-react';

export function TeacherGroupsPage() {
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await gradesApi.getTeacherGroups();
      setGroups(data);
    } catch {
      toast.error('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Grupos</h1>
          <p className="text-gray-500">Materias que imparte este ciclo</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">
              No tienes grupos asignados. Contacta al administrador.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <BookOpen className="text-blue-600" size={24} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge
                      status={group.cycleEnded ? 'completed' : 'active'}
                      label={group.cycleEnded ? 'Ciclo finalizado' : 'Ciclo activo'}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-gray-900">
                    {group.subjectCode} - {group.subjectName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Grupo {group.groupNumber} | {group.cycleName} | {group.classroomName || 'Sin aula'}
                  </p>
                  <p className="text-xs text-gray-400">{group.credits} creditos</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-xs text-gray-500">Registrados</p>
                    <p className="font-semibold">{group.enrolledCount}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-xs text-gray-500">Con nota</p>
                    <p className="font-semibold">{group.gradedCount}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link to={`/notas-docente/${group.id}`}>
                    <Button size="sm">
                      Gestionar Notas <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <AlertTriangle size={18} className="mt-0.5 text-yellow-500" />
            <p>
              Cuando el ciclo academico haya finalizado ya no se podran modificar las notas.
              Las notas son calificaciones de 0 a 100; se considera aprobada una materia con 60 o mas.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}