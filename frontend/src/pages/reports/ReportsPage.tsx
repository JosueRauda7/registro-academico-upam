import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { cyclesApi } from '@/api/cycles.api';
import { reportsApi } from '@/api/reports.api';
import { gradesApi } from '@/api/grades.api';
import { Cycle, TeacherGroup, UserRole } from '@/types';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  FileText,
  Users,
  DollarSign,
  Download,
} from 'lucide-react';

export function ReportsPage() {
  const { user, hasRole } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCycles();
    if (hasRole(UserRole.TEACHER)) {
      loadTeacherGroups();
    }
  }, []);

  const loadCycles = async () => {
    try {
      const data = await cyclesApi.findAll();
      setCycles(data);
      if (data.length > 0) setSelectedCycle(data[0].id);
    } catch (err) {
      toast.error('Error al cargar ciclos');
    }
  };

  const loadTeacherGroups = async () => {
    try {
      const data = await gradesApi.getTeacherGroups();
      setTeacherGroups(data);
    } catch (err) {
      // noop
    }
  };

  const handleDownloadGroupExcel = async (groupId: string, filename: string) => {
    setLoading(`group-${groupId}`);
    try {
      const data = await gradesApi.exportGroup(groupId);
      downloadFile(data, filename);
      toast.success('Reporte descargado');
    } catch (err) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(null);
    }
  };

  const downloadFile = (data: any, filename: string) => {
    const blob = new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadStudentPayments = async () => {
    setLoading('student-payments');
    try {
      const data = await reportsApi.downloadStudentPayments(
        user?.id || '',
        selectedCycle,
      );
      downloadFile(data, 'reporte-pagos-estudiante.xlsx');
      toast.success('Reporte descargado');
    } catch (err) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadEnrollmentReport = async () => {
    if (!selectedCycle) return;
    setLoading('enrollments');
    try {
      const data = await reportsApi.downloadEnrollmentReport(selectedCycle);
      downloadFile(data, 'reporte-inscripciones.xlsx');
      toast.success('Reporte descargado');
    } catch (err) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadCollectionReport = async () => {
    if (!selectedCycle) return;
    setLoading('collection');
    try {
      const data = await reportsApi.downloadCollectionReport(selectedCycle);
      downloadFile(data, 'reporte-recaudacion.xlsx');
      toast.success('Reporte descargado');
    } catch (err) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadStudentList = async () => {
    if (!selectedCycle) return;
    setLoading('student-list');
    try {
      const data = await reportsApi.downloadStudentList(selectedCycle);
      downloadFile(data, 'lista-estudiantes.xlsx');
      toast.success('Reporte descargado');
    } catch (err) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      id: 'student-payments',
      title: 'Mis Pagos',
      description: 'Reporte de pagos personales del estudiante',
      icon: FileSpreadsheet,
      roles: ['student'],
      action: handleDownloadStudentPayments,
    },
    {
      id: 'enrollments',
      title: 'Inscripciones por Ciclo',
      description: 'Listado de todas las inscripciones del ciclo',
      icon: Users,
      roles: ['administrator', 'administrative'],
      action: handleDownloadEnrollmentReport,
    },
    {
      id: 'collection',
      title: 'Recaudación',
      description: 'Reporte de recaudación del ciclo',
      icon: DollarSign,
      roles: ['administrator', 'collector'],
      action: handleDownloadCollectionReport,
    },
    {
      id: 'student-list',
      title: 'Lista de Estudiantes',
      description: 'Listado completo de estudiantes del ciclo',
      icon: Users,
      roles: ['administrator', 'administrative'],
      action: handleDownloadStudentList,
    },
  ];

  const filteredReports = reports.filter(
    (r) => !r.roles || hasRole(...r.roles as any),
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">
            Genera reportes en Excel y PDF del sistema académico
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Ciclo:</label>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
          >
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
        </div>

        {hasRole(UserRole.TEACHER) && (
          <Card title="Notas de Estudiantes por Grupo" subtitle="Lista de estudiantes y calificaciones de cada grupo que imparte">
            <div className="space-y-3">
              {teacherGroups.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No tienes grupos asignados.
                </p>
              ) : (
                teacherGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {group.subjectCode} - {group.subjectName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {group.cycleName} | Grupo {group.groupNumber} |{' '}
                        {group.enrolledCount} estudiantes | {group.gradedCount} con nota
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loading === `group-${group.id}`}
                      onClick={() =>
                        handleDownloadGroupExcel(
                          group.id,
                          `notas-${group.subjectCode}-grupo${group.groupNumber}.xlsx`,
                        )
                      }
                    >
                      <Download size={14} className="mr-2" /> Excel
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredReports.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-upam-light">
                  <report.icon className="text-upam-primary" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={loading === report.id}
                  onClick={report.action}
                >
                  <Download size={14} className="mr-1" />
                  Descargar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
