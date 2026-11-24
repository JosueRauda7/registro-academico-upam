import { SearchableSelect } from '@/components/ui/SearchableSelect';
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
import { Banknote, ImagePlus, Landmark, Search, Trash2, User } from 'lucide-react';

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;

const BANK_OPTIONS = [
  'Banco Agrícola',
  'Banco Cuscatlán',
  'Banco Davivienda Salvadoreño',
  'Banco G&T Continental',
  'Banco Promerica',
  'Banco Azul',
  'Banco Hipotecario',
  'Banco de Fomento Agropecuario',
  'BANCOVIMA',
];

const emptyForm = {
  type: 'tuition' as 'tuition' | 'monthly',
  month: '',
  description: '',
  paymentMethod: 'cash' as 'cash' | 'bank',
  bankName: '',
  bankTransactionCode: '',
};

export function ColecturiaPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

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

  const handleReceiptFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('El comprobante debe ser una imagen');
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      toast.error('El comprobante no puede superar los 5MB');
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount =
      form.type === 'monthly'
        ? students.find(s => s.id === selectedStudent)?.monthlyAmount ?? selectedCycleData?.monthlyAmount
        : students.find(s => s.id === selectedStudent)?.tuitionAmount ?? selectedCycleData?.tuitionAmount;

    if (!selectedStudent || !selectedCycle || !amount) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    if (form.type === 'monthly' && !form.month) {
      toast.error('Seleccione el mes');
      return;
    }
    if (form.paymentMethod === 'bank' && !form.bankName.trim()) {
      toast.error('Indique el banco de la transacción');
      return;
    }
    if (form.paymentMethod === 'bank' && !form.bankTransactionCode.trim()) {
      toast.error('Indique el código de la transacción bancaria');
      return;
    }

    setSubmitting(true);
    try {
      let receiptImageUrl: string | undefined;
      if (receiptFile) {
        const upload = await paymentsApi.uploadReceipt(receiptFile);
        receiptImageUrl = upload.url;
      }

      await paymentsApi.createManualPayment({
        studentId: selectedStudent,
        cycleId: selectedCycle,
        amount,
        type: form.type,
        month: form.type === 'monthly' ? parseInt(form.month) : undefined,
        description: form.description || undefined,
        paymentMethod: form.paymentMethod,
        bankName: form.paymentMethod === 'bank' ? form.bankName : undefined,
        bankTransactionCode:
          form.paymentMethod === 'bank' ? form.bankTransactionCode : undefined,
        receiptImageUrl,
      });
      toast.success('Pago registrado exitosamente');
      setForm(emptyForm);
      clearReceipt();
      setSelectedStudent('');
      setSearchTerm('');
      loadPayments();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message?.[0] ||
          err.response?.data?.message ||
          'Error al registrar pago',
      );
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
  const fixedAmount =
    form.type === 'monthly'
      ? students.find(s => s.id === selectedStudent)?.monthlyAmount ?? selectedCycleData?.monthlyAmount
      : students.find(s => s.id === selectedStudent)?.tuitionAmount ?? selectedCycleData?.tuitionAmount;

  const methodLabel = (p: Payment) =>
    p.paymentMethod === 'bank' ? 'Banco' : p.paymentMethod === 'cash' ? 'Efectivo' : 'Wompi';

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colecturía</h1>
          <p className="text-gray-500">Registro de pagos en efectivo y transacciones bancarias</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Manual Payment Form */}
          <Card title="Registrar Pago Manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cycle */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ciclo Académico *
                </label>
                <SearchableSelect
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                  required
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </SearchableSelect>
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
                    Matrícula
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
                  <SearchableSelect
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                    required
                  >
                    <option value="">Seleccionar mes</option>
                    {Array.from({ length: selectedCycleData?.monthlyCount || 6 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Mes {i + 1}</option>
                    ))}
                  </SearchableSelect>
                </div>
              )}

              {/* Amount (fixed to cycle value) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Monto (USD) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={fixedAmount ?? ''}
                    readOnly
                    tabIndex={-1}
                    className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Fijo
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedCycleData
                    ? form.type === 'tuition'
                      ? `Matrícula: ${formatCurrency(fixedAmount ?? selectedCycleData.tuitionAmount)}`
                      : `Mensualidad: ${formatCurrency(fixedAmount ?? selectedCycleData.monthlyAmount)}`
                    : 'Seleccione un ciclo para ver el monto'}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Método de Pago *
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'cash' })}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      form.paymentMethod === 'cash'
                        ? 'border-upam-primary bg-upam-primary text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Banknote size={15} className="mr-1.5 inline" />
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'bank' })}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      form.paymentMethod === 'bank'
                        ? 'border-upam-primary bg-upam-primary text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Landmark size={15} className="mr-1.5 inline" />
                    Transacción Bancaria
                  </button>
                </div>
              </div>

              {/* Bank Fields */}
              {form.paymentMethod === 'bank' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Banco *
                    </label>
                    <input
                      type="text"
                      list="bank-options"
                      placeholder="Seleccione o escriba el banco"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                      required
                    />
                    <datalist id="bank-options">
                      {BANK_OPTIONS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Código de Transacción Bancaria *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. TRX-2026-000123"
                      value={form.bankTransactionCode}
                      onChange={(e) => setForm({ ...form, bankTransactionCode: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none focus:ring-1 focus:ring-upam-primary"
                      required
                    />
                  </div>

                  {/* Receipt Image */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Comprobante de Pago (opcional)
                    </label>
                    {receiptPreview ? (
                      <div className="relative">
                        <img
                          src={receiptPreview}
                          alt="Comprobante"
                          className="h-40 w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                        />
                        <button
                          type="button"
                          onClick={clearReceipt}
                          className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
                          title="Quitar comprobante"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragging(false);
                          handleReceiptFile(e.dataTransfer.files?.[0]);
                        }}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
                          dragging
                            ? 'border-upam-primary bg-upam-primary/5'
                            : 'border-gray-300 text-gray-500 hover:border-upam-primary hover:text-upam-primary'
                        }`}
                      >
                        <ImagePlus size={26} className="mb-2 text-gray-400" />
                        <span>
                          Arrastre el comprobante aquí o{' '}
                          <span className="font-medium text-upam-primary">seleccione un archivo</span>
                        </span>
                        <span className="mt-1 text-xs text-gray-400">
                          JPG, PNG o WEBP, máximo 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleReceiptFile(e.target.files?.[0]!)}
                        />
                      </label>
                    )}
                  </div>
                </>
              )}

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
                Registrar Pago
              </Button>
            </form>
          </Card>

          {/* Payment History */}
          <Card title="Pagos Registrados">
            {payments.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No hay pagos registrados para este ciclo</p>
            ) : (
              <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Estudiante</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Monto</th>
                      <th className="pb-3 font-medium">Ref</th>
                      <th className="pb-3 font-medium">Método</th>
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
                          {p.type === 'tuition' ? 'Matrícula' : `Mes ${p.month}`}
                        </td>
                        <td className="py-3 font-semibold text-xs">{formatCurrency(p.amount)}</td>
                        <td className="py-3 font-mono text-xs">{p.reference}</td>
                        <td className="py-3 text-xs">
                          <div>
                            <span className={`rounded px-2 py-1 text-xs font-medium ${
                              p.paymentMethod === 'bank'
                                ? 'bg-blue-50 text-blue-700'
                                : p.paymentMethod === 'cash'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {methodLabel(p)}
                            </span>
                            {p.paymentMethod === 'bank' && (
                              <p className="mt-1 max-w-[160px] text-xs text-gray-500">
                                {p.bankName}
                                {p.bankTransactionCode && (
                                  <span className="block font-mono text-[11px]">
                                    {p.bankTransactionCode}
                                  </span>
                                )}
                                {p.receiptImageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => paymentsApi.openReceipt(p.receiptImageUrl!).catch(() => toast.error('No se pudo descargar el comprobante'))}
                                    className="mt-0.5 inline-block font-medium text-upam-primary hover:underline"
                                  >
                                    Ver comprobante
                                  </button>
                                )}
                              </p>
                            )}
                          </div>
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
      </div>
    </Layout>
  );
}
