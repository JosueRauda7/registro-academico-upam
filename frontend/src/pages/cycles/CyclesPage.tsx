import { FormEvent, useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useDialog } from '@/context/DialogContext';
import { cyclesApi } from '@/api/cycles.api';
import { Cycle } from '@/types';
import { formatDate, formatCurrency } from '@/utils/formatDate';
import toast from 'react-hot-toast';
import { Calendar, Plus, Pencil } from 'lucide-react';

const emptyForm = () => ({ name: '', year: String(new Date().getFullYear()), semester: '1', startDate: '', endDate: '', tuitionAmount: '', monthlyAmount: '', monthlyCount: '4', isActive: true });
const errorMessage = (error: any, fallback: string) => {
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message[0] : message || fallback;
};

export function CyclesPage() {
  const { confirm } = useDialog();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Cycle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadCycles = async () => {
    try { setCycles(await cyclesApi.findAll()); }
    catch { toast.error('Error al cargar ciclos'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadCycles(); }, []);

  const openForm = (cycle?: Cycle) => {
    setEditing(cycle || null);
    setForm(cycle ? {
      name: cycle.name, year: String(cycle.year), semester: String(cycle.semester), startDate: cycle.startDate.slice(0, 10), endDate: cycle.endDate.slice(0, 10),
      tuitionAmount: String(cycle.tuitionAmount), monthlyAmount: String(cycle.monthlyAmount), monthlyCount: String(cycle.monthlyCount), isActive: cycle.isActive,
    } : emptyForm());
    setShowModal(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (form.startDate >= form.endDate) { toast.error('La fecha de fin debe ser posterior a la de inicio'); return; }
    if (editing?.isActive && !form.isActive && !(await confirm('¿Desactivar este ciclo? También se cerrarán sus inscripciones.'))) return;
    setBusy(true);
    try {
      const data = { name: form.name.trim(), year: Number(form.year), semester: Number(form.semester), startDate: form.startDate, endDate: form.endDate,
        tuitionAmount: Number(form.tuitionAmount), monthlyAmount: Number(form.monthlyAmount), monthlyCount: Number(form.monthlyCount) };
      if (editing) await cyclesApi.update(editing.id, { ...data, isActive: form.isActive });
      else await cyclesApi.create(data);
      toast.success(editing ? 'Ciclo actualizado' : 'Ciclo creado con inscripciones cerradas');
      setShowModal(false);
      await loadCycles();
    } catch (error) { toast.error(errorMessage(error, 'No se pudo guardar el ciclo')); }
    finally { setBusy(false); }
  };

  const toggleEnrollment = async (cycle: Cycle) => {
    if (busy) return;
    if (!(await confirm(`¿${cycle.enrollmentOpen ? 'Cerrar' : 'Abrir'} las inscripciones de ${cycle.name}?`))) return;
    setBusy(true);
    try {
      if (cycle.enrollmentOpen) await cyclesApi.closeEnrollment(cycle.id);
      else await cyclesApi.openEnrollment(cycle.id);
      toast.success(cycle.enrollmentOpen ? 'Inscripciones cerradas' : 'Inscripciones abiertas');
      await loadCycles();
    } catch (error) { toast.error(errorMessage(error, 'No se pudo cambiar la inscripción')); }
    finally { setBusy(false); }
  };

  return <Layout>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">Gestión de Ciclos</h1><p className="text-gray-500">Configura fechas, aranceles base e inscripciones.</p></div>
        <Button onClick={() => openForm()} disabled={busy}><Plus size={16} className="mr-2" />Nuevo ciclo</Button>
      </div>
      <p className="text-sm text-gray-600">La matrícula y mensualidad base se usan cuando el estudiante no tiene un importe propio configurado para ese concepto. Los pagos ya creados conservan su importe.</p>
      {loading ? <p>Cargando ciclos…</p> : cycles.length === 0 ? <Card>No hay ciclos registrados. Crea el primer ciclo para comenzar.</Card> : <div className="space-y-4">
        {cycles.map(cycle => <Card key={cycle.id}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><Calendar className="text-upam-primary" /><div>
              <h2 className="font-semibold text-gray-900">{cycle.name}</h2>
              <p className="text-sm text-gray-500">{formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}</p>
              <p className="text-sm text-gray-600">{cycle.isActive ? 'Activo' : 'Inactivo'} · {cycle.enrollmentOpen ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}</p>
            </div></div>
            <div className="flex flex-wrap gap-5 text-sm">
              <div>Matrícula base<p className="font-semibold">{formatCurrency(cycle.tuitionAmount)}</p></div>
              <div>Mensualidad base<p className="font-semibold">{formatCurrency(cycle.monthlyAmount)}</p></div>
              <div>Mensualidades<p className="font-semibold">{cycle.monthlyCount}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => openForm(cycle)}><Pencil size={14} className="mr-1" />Editar</Button>
              <Button variant={cycle.enrollmentOpen ? 'danger' : 'primary'} size="sm" disabled={busy || !cycle.isActive} onClick={() => toggleEnrollment(cycle)}>
                {cycle.enrollmentOpen ? 'Cerrar inscripciones' : 'Abrir inscripciones'}
              </Button>
            </div>
          </div>
        </Card>)}
      </div>}
    </div>
    <Modal isOpen={showModal} onClose={() => { if (!busy) setShowModal(false); }} title={editing ? 'Editar ciclo' : 'Nuevo ciclo'}>
      <form onSubmit={save} className="space-y-4">
        <Input id="cycle-name" label="Nombre" value={form.name} maxLength={100} required onChange={e => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input id="cycle-year" label="Año" type="number" min={1900} max={2200} step="1" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
          <Input id="cycle-semester" label="Período (1 a 3)" type="number" min="1" max="3" step="1" required value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} />
          <Input id="cycle-start" label="Fecha de inicio" type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          <Input id="cycle-end" label="Fecha de fin" type="date" required min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          <Input id="cycle-tuition" label="Matrícula base (USD)" type="number" min="0.01" max="99999999.99" step="0.01" required value={form.tuitionAmount} onChange={e => setForm({ ...form, tuitionAmount: e.target.value })} />
          <Input id="cycle-monthly" label="Mensualidad base (USD)" type="number" min="0.01" max="99999999.99" step="0.01" required value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} />
        </div>
        <Input id="cycle-count" label="Cantidad de mensualidades" type="number" min="1" max="12" step="1" required value={form.monthlyCount} onChange={e => setForm({ ...form, monthlyCount: e.target.value })} />
        {editing ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Ciclo activo (desactivarlo cierra las inscripciones)</label> : <p className="text-sm text-gray-500">El ciclo se creará activo. Podrás abrir las inscripciones desde su tarjeta.</p>}
        <p className="text-sm text-gray-500">Los aranceles propios del estudiante tienen prioridad. Cambiar precios no modifica pagos ya creados.</p>
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={busy} onClick={() => setShowModal(false)}>Cancelar</Button><Button type="submit" loading={busy}>{editing ? 'Guardar cambios' : 'Crear ciclo'}</Button></div>
      </form>
    </Modal>
  </Layout>;
}
