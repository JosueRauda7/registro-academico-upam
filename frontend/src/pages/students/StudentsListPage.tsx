import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { studentsApi } from '@/api/reports.api';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';

export function StudentsListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await studentsApi.findAll();
      setStudents(data);
    } catch (err) {
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-500">Listado de estudiantes registrados</p>
        </div>

        <Card>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No hay estudiantes registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Carnet</th>
                    <th className="pb-3 font-medium">Codigo</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Carrera</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any) => (
                    <tr key={student.id} className="border-b last:border-0">
                      <td className="py-3 font-mono">{student.carnet}</td>
                      <td className="py-3 font-mono text-xs">{student.studentCode}</td>
                      <td className="py-3">
                        {student.user?.firstName} {student.user?.lastName}
                      </td>
                      <td className="py-3">{student.career}</td>
                      <td className="py-3">{student.user?.email}</td>
                      <td className="py-3">
                        <Badge status={student.user?.isActive ? 'active' : 'cancelled'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
