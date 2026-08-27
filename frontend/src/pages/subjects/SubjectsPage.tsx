import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { subjectsApi } from '@/api/subjects.api';
import { careersApi } from '@/api/careers.api';
import { Subject, Career } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const emptyForm = { code: '', name: '', credits: '', career: '', year: '1', semester: '1' };

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, c] = await Promise.all([subjectsApi.findAll(undefined, true), careersApi.findAll()]);
      setSubjects(s);
      setCareers(c);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filtered = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.career.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, career: careers[0]?.name || '' });
    setShowModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      code: s.code,
      name: s.name,
      credits: String(s.credits),
      career: s.career,
      year: String(s.year),
      semester: String(s.semester),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        credits: parseInt(form.credits),
        career: form.career,
        year: parseInt(form.year),
        semester: parseInt(form.semester),
      };
      if (editing) {
        await subjectsApi.update(editing.id, payload);
        toast.success('Materia actualizada');
      } else {
        await subjectsApi.create(payload);
        toast.success('Materia creada');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al guardar materia');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Subject) => {
    if (!confirm(`¿Desactivar la materia ${s.code} - ${s.name}?\nNo se eliminan inscripciones existentes.`)) return;
    try {
      await subjectsApi.remove(s.id);
      toast.success('Materia desactivada');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al desactivar materia');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion de Materias</h1>
            <p className="text-gray-500">Administracion del catalogo de materias por carrera</p>
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
              <Plus size={16} className="mr-2" /> Nueva Materia
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">No hay materias registradas</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Codigo</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Carrera</th>
                    <th className="px-4 py-3 text-center">Creditos</th>
                    <th className="px-4 py-3 text-center">Año</th>
                    <th className="px-4 py-3 text-center">Semestre</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">{s.code}</td>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3">{s.career}</td>
                      <td className="px-4 py-3 text-center">{s.credits}</td>
                      <td className="px-4 py-3 text-center">{s.year}</td>
                      <td className="px-4 py-3 text-center">{s.semester}</td>
                      <td className="px-4 py-3">
                        <Badge status={s.isActive ? 'active' : 'failed'} label={s.isActive ? 'Activa' : 'Inactiva'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                            <Pencil size={14} />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(s)}>
                            <Trash2 size={14} />
                          </Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Materia' : 'Nueva Materia'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Codigo *"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Ej. MAT101"
              required
            />
            <Input
              label="Creditos *"
              type="number"
              min="1"
              max="10"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: e.target.value })}
              required
            />
          </div>
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej. Matematica I"
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Carrera *</label>
            <select
              value={form.career}
              onChange={(e) => setForm({ ...form, career: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              {careers.length === 0 && <option value="">Sin carreras registradas</option>}
              {careers.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Año *"
              type="number"
              min="1"
              max="5"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
            />
            <Input
              label="Semestre *"
              type="number"
              min="1"
              max="2"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Guardar Cambios' : 'Crear Materia'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}