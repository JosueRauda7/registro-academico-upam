import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { paymentsApi } from '@/api/payments.api';
import { cyclesApi } from '@/api/cycles.api';
import { studentsApi } from '@/api/students.api';
import { Payment, Cycle, Student } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatDate';
import toast from 'react-hot-toast';
import { Banknote, Search, User } from 'lucide-react';

export function ColecturiaPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: 'tuition' as 'tuition' | 'monthly',
    amount: '',
    month: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      loadPayments();
    }
  }, [selectedCycle]);

  const loadData = async () => {
    try {
      const [cyclesData, studentsData] = await Promise.all([
        cyclesApi.findAll(),
        studentsApi.findAll(),
      ]);
      setCycles(cyclesData);
      setStudents(studentsData);
      if (cyclesData.length > 0) setSelectedCycle(cyclesData[0].id);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await paymentsApi.getAllPayments(selectedCycle);
      setPayments(data);
    } catch {
      // Handle error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCycle || !form.amount) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      await paymentsApi.createManualPayment({
        studentId: selectedStudent,
        cycleId: selectedCycle,
        amount: parseFloat(form.amount),
        type: form.type,
        month: form.type === 'monthly' ? parseInt(form.month) : undefined,
        description: form.description || undefined,
      });
      toast.success('Pago registrado exitosamente');
      setForm({ type: 'tuition', amount: '', month: '', description: '' });
      setSelectedStudent('');
      loadPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || err.response?.data?.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.carnet?.toLowerCase().includes(term) ||
      s.studentCode?.toLowerCase().includes(term) ||
      s.user?.firstName?.toLowerCase().includes(term) ||
      s.user?.lastName?.toLowerCase().includes(term) ||
      s.user?.email?.toLowerCase().includes(term)
    );
  });

  const selectedCycleData = cycles.find((c) => c.id === selectedCycle);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colecturia</h1>
          <p className="text-gray-500">Registro de pagos manuales en efectivo</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Manual Payment Form */}
          <Card title="Registrar Pago Manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cycle */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ciclo Academico *
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                  required
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Student Search */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Estudiante *
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por carnet, nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                  />
                </div>
                {searchTerm && filteredStudents.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    {filteredStudents.slice(0, 10).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(s.id);
                          setSearchTerm(`${s.carnet || s.studentCode} - ${s.user.firstName} ${s.user.lastName}`);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium">{s.carnet || s.studentCode}</span>
                        <span className="text-gray-500">{s.user.firstName} {s.user.lastName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipo de Pago *
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'tuition', month: '' })}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      form.type === 'tuition'
                        ? 'border-upam-primary bg-upam-primary text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    Matricula
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'monthly' })}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      form.type === 'monthly'
                        ? 'border-upam-primary bg-upam-primary text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    Mensualidad
                  </button>
                </div>
              </div>

              {/* Month (if monthly) */}
              {form.type === 'monthly' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Mes *
                  </label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                    required
                  >
                    <option value="">Seleccionar mes</option>
                    {Array.from({ length: selectedCycleData?.monthlyCount || 6 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Mes {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Monto (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                  required
                />
                {selectedCycleData && (
                  <p className="mt-1 text-xs text-gray-500">
                    {form.type === 'tuition'
                      ? `Matricula: ${formatCurrency(selectedCycleData.tuitionAmount)}`
                      : `Mensualidad: ${formatCurrency(selectedCycleData.monthlyAmount)}`}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas sobre el pago..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                />
              </div>

              <Button type="submit" className="w-full" loading={submitting}>
                <Banknote size={16} className="mr-2" />
                Registrar Pago en Efectivo
              </Button>
            </form>
          </Card>

          {/* Payment History */}
          <Card title="Pagos Registrados">
            {payments.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No hay pagos registrados para este ciclo</p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Estudiante</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Monto</th>
                      <th className="pb-3 font-medium">Ref</th>
                      <th className="pb-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 text-xs">{formatDate(p.createdAt)}</td>
                        <td className="py-3">
                          <div className="text-xs">
                            <p className="font-medium">{p.student?.user?.firstName} {p.student?.user?.lastName}</p>
                            <p className="text-gray-500">{p.student?.carnet}</p>
                          </div>
                        </td>
                        <td className="py-3 text-xs">
                          {p.type === 'tuition' ? 'Matricula' : `Mes ${p.month}`}
                        </td>
                        <td className="py-3 font-semibold text-xs">{formatCurrency(p.amount)}</td>
                        <td className="py-3 font-mono text-xs">{p.reference}</td>
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
      </div>
    </Layout>
  );
}
