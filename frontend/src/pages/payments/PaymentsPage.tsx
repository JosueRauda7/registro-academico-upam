import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { paymentsApi } from '@/api/payments.api';
import { cyclesApi } from '@/api/cycles.api';
import { Payment, Cycle, PaymentSummary } from '@/types';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatDate';
import { getStatusLabel } from '@/utils/validators';
import toast from 'react-hot-toast';
import { CreditCard, Download } from 'lucide-react';

export function PaymentsPage() {
  const { hasRole } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);

  useEffect(() => {
    loadCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      loadPayments();
    }
  }, [selectedCycle]);

  const loadCycles = async () => {
    try {
      const data = await cyclesApi.findAll();
      setCycles(data);
      if (data.length > 0) {
        setSelectedCycle(data[0].id);
      }
    } catch (err) {
      toast.error('Error al cargar ciclos');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const [paymentsData, summaryData] = await Promise.all([
        paymentsApi.getMyPaymentsByCycle(selectedCycle),
        paymentsApi.getPaymentSummary(selectedCycle),
      ]);
      setPayments(paymentsData);
      setSummary(summaryData);
    } catch (err) {
      // Handle error
    }
  };

  const handlePayMonthly = async (month: number) => {
    setPaying(month);
    try {
      await paymentsApi.createMonthlyPayment(selectedCycle, month);
      toast.success(`Pago mensualidad ${month} creado`);
      loadPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear pago');
    } finally {
      setPaying(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500">Gestiona tus pagos de matrícula y mensualidades</p>
        </div>

        {/* Cycle Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Seleccionar Ciclo:</label>
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

        {/* Payment Summary */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Matrícula</p>
                <p className="text-2xl font-bold text-upam-primary">
                  {formatCurrency(summary.tuitionAmount)}
                </p>
                <Badge status={summary.tuitionPaid ? 'completed' : 'pending'} />
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Pagado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Pendiente</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalPending)}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Monthly Payments */}
        {summary && (
          <Card title="Mensualidades">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summary.monthlyPayments.map((mp) => (
                <div
                  key={mp.month}
                  className={`rounded-lg border p-4 ${
                    mp.paid ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{getMonthName(mp.month)}</p>
                    {mp.paid ? (
                      <span className="text-xs text-green-600">Pagado</span>
                    ) : (
                      <span className="text-xs text-red-600">Pendiente</span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(mp.amount)}</p>
                  {mp.paid && mp.paymentDate && (
                    <p className="text-xs text-gray-500">
                      Pagado: {formatDate(mp.paymentDate)}
                    </p>
                  )}
                  {!mp.paid && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      loading={paying === mp.month}
                      onClick={() => handlePayMonthly(mp.month)}
                    >
                      <CreditCard size={14} className="mr-1" />
                      Pagar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Payment History */}
        <Card title="Historial de Pagos">
          {payments.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No hay pagos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Referencia</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Monto</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3">{formatDate(p.createdAt)}</td>
                      <td className="py-3 font-mono text-xs">{p.reference}</td>
                      <td className="py-3">
                        {p.type === 'tuition'
                          ? 'Matrícula'
                          : `Mensualidad ${p.month || ''}`}
                      </td>
                      <td className="py-3 font-semibold">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3">
                        <Badge status={p.status} />
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
