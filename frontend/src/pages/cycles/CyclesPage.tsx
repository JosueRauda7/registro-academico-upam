import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cyclesApi } from '@/api/cycles.api';
import { Cycle } from '@/types';
import { formatDate } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatDate';
import toast from 'react-hot-toast';
import { Calendar, Settings } from 'lucide-react';

export function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      const data = await cyclesApi.findAll();
      setCycles(data);
    } catch (err) {
      toast.error('Error al cargar ciclos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnrollment = async (id: string) => {
    try {
      await cyclesApi.openEnrollment(id);
      toast.success('Inscripcion abierta');
      loadCycles();
    } catch (err) {
      toast.error('Error al abrir inscripcion');
    }
  };

  const handleCloseEnrollment = async (id: string) => {
    try {
      await cyclesApi.closeEnrollment(id);
      toast.success('Inscripcion cerrada');
      loadCycles();
    } catch (err) {
      toast.error('Error al cerrar inscripcion');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de Ciclos</h1>
          <p className="text-gray-500">Administra los ciclos academicos</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {cycles.map((cycle) => (
            <Card key={cycle.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-upam-light">
                    <Calendar className="text-upam-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cycle.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Matricula</p>
                    <p className="font-semibold">{formatCurrency(cycle.tuitionAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Mensualidad</p>
                    <p className="font-semibold">{formatCurrency(cycle.monthlyAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Mensualidades</p>
                    <p className="font-semibold">{cycle.monthlyCount}</p>
                  </div>
                  <Badge status={cycle.isActive ? 'active' : 'cancelled'} />
                  <Badge status={cycle.enrollmentOpen ? 'active' : 'pending'} />
                  <div className="flex gap-2">
                    {cycle.enrollmentOpen ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCloseEnrollment(cycle.id)}
                      >
                        Cerrar Inscripcion
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenEnrollment(cycle.id)}
                      >
                        Abrir Inscripcion
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
