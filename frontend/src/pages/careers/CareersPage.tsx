import { useDialog } from '@/context/DialogContext';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { careersApi } from '@/api/careers.api';
import { Career, CareerInput } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Search, GraduationCap } from 'lucide-react';

const emptyForm = { code: '', name: '', description: '', years: '5', semestersPerYear: '2' };

export function CareersPage() {
  const { confirm } = useDialog();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Career | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setCareers(await careersApi.findAll(true));
    } catch {
      toast.error('Error al cargar carreras');
    } finally {
      setLoading(false);
    }
  };

  const filtered = careers.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = careers.filter((c) => c.isActive).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Career) => {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      description: c.description || '',
      years: String(c.years),
      semestersPerYear: String(c.semestersPerYear),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: CareerInput = {
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        years: parseInt(form.years),
        semestersPerYear: parseInt(form.semestersPerYear),
      };
      if (editing) {
        await careersApi.update(editing.id, payload);
        toast.success('Carrera actualizada');
      } else {
        await careersApi.create(payload);
        toast.success('Carrera creada');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al guardar carrera');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Career) => {
    if (
      !(await confirm(
        `¿Desactivar la carrera ${c.name}?\nNo se permite si tiene materias activas asignadas.`,
      ))
    )
      return;
    try {
      await careersApi.remove(c.id);
      toast.success('Carrera desactivada');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al desactivar carrera');
    }
  };

  const handleReactivate = async (c: Career) => {
    try {
      await careersApi.reactivate(c.id);
      toast.success('Carrera reactivada');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al reactivar carrera');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mantenimiento de Carreras</h1>
            <p className="text-gray-500">
              {activeCount} carrera(s) activa(s) - los años y semestres definen la estructura del pensum
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-upam-primary focus:outline-none"
              />
            </div>
            <Button onClick={openCreate}>
              <Plus size={16} className="mr-2" /> Nueva Carrera
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">No hay carreras registradas</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-center">Años</th>
                    <th className="px-4 py-3 text-center">Sem/Año</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={16} className="text-upam-primary" />
                          <span className="font-semibold">{c.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.description || '-'}</td>
                      <td className="px-4 py-3 text-center">{c.years}</td>
                      <td className="px-4 py-3 text-center">{c.semestersPerYear}</td>
                      <td className="px-4 py-3">
                        <Badge status={c.isActive ? 'active' : 'failed'} label={c.isActive ? 'Activa' : 'Inactiva'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                            <Pencil size={14} />
                          </Button>
                          {c.isActive ? (
                            <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
                              <Trash2 size={14} />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleReactivate(c)}>
                              <RotateCcw size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Carrera' : 'Nueva Carrera'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Código *"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Ej. IIS"
              required
            />
            <Input
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Ingeniería en Sistemas"
              required
            />
          </div>
          <Input
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción opcional de la carrera"
          />
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-500">Estructura del pensum</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total de años *"
                type="number"
                min="1"
                max="10"
                value={form.years}
                onChange={(e) => setForm({ ...form, years: e.target.value })}
                required
              />
              <Input
                label="Semestres por año *"
                type="number"
                min="1"
                max="4"
                value={form.semestersPerYear}
                onChange={(e) => setForm({ ...form, semestersPerYear: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar Cambios' : 'Crear Carrera'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
