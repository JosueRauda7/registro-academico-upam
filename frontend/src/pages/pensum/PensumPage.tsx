import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useDialog } from '@/context/DialogContext';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { pensumApi } from '@/api/pensum.api';
import { subjectsApi } from '@/api/subjects.api';
import { careersApi } from '@/api/careers.api';
import { Pensum, PensumSubject, Career } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, RotateCcw, Layers } from 'lucide-react';

interface EditForm {
  subject: PensumSubject;
  year: string;
  semester: string;
}

interface CreateForm {
  open: boolean;
  year: string;
  semester: string;
  code: string;
  name: string;
  credits: string;
}

export function PensumPage() {
  const { confirm } = useDialog();
  const [careers, setCareers] = useState<Career[]>([]);
  const [career, setCareer] = useState('');
  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({ open: false, year: '1', semester: '1', code: '', name: '', credits: '' });
  const [structureForm, setStructureForm] = useState<{ open: boolean; years: string; semesters: string }>({
    open: false,
    years: '5',
    semesters: '2',
  });
  const [saving, setSaving] = useState(false);

  const selectedCareer = careers.find((c) => c.name === career) || null;

  useEffect(() => {
    loadInit();
  }, []);

  useEffect(() => {
    if (career) loadData(career);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career]);

  const loadInit = async () => {
    try {
      const c = await careersApi.findAll();
      setCareers(c);
      if (c.length > 0) setCareer((prev) => prev || c[0].name);
    } catch {
      toast.error('Error al cargar carreras');
    }
  };

  const loadData = async (c: string) => {
    try {
      setLoading(true);
      setPensum(await pensumApi.get(c));
    } catch {
      toast.error('Error al cargar el pensum');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (s: PensumSubject) => {
    setEditForm({ subject: s, year: String(s.year), semester: String(s.semester) });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm?.subject) return;
    setSaving(true);
    try {
      await subjectsApi.update(editForm.subject.id, {
        year: parseInt(editForm.year),
        semester: parseInt(editForm.semester),
      });
      toast.success('Materia movida en el pensum');
      setEditForm(null);
      loadData(career);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar materia');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = (year: number, semester: number) => {
    setCreateForm({ open: true, year: String(year), semester: String(semester), code: '', name: '', credits: '' });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await subjectsApi.create({
        code: createForm.code.toUpperCase().trim(),
        name: createForm.name.trim(),
        credits: parseInt(createForm.credits),
        career,
        year: parseInt(createForm.year),
        semester: parseInt(createForm.semester),
      });
      toast.success('Materia agregada al pensum');
      setCreateForm({ ...createForm, open: false });
      loadData(career);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear materia');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (s: PensumSubject) => {
    if (!(await confirm(`¿Desactivar ${s.code} - ${s.name} del pensum?`))) return;
    try {
      await subjectsApi.remove(s.id);
      toast.success('Materia desactivada');
      loadData(career);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al desactivar');
    }
  };

  const handleActivate = async (s: PensumSubject) => {
    try {
      await subjectsApi.update(s.id, { isActive: true });
      toast.success('Materia reactivada');
      loadData(career);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al reactivar');
    }
  };

  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCareer) return;
    setSaving(true);
    try {
      await careersApi.update(selectedCareer.id, {
        years: parseInt(structureForm.years),
        semestersPerYear: parseInt(structureForm.semesters),
      });
      toast.success('Estructura del pensum actualizada');
      setStructureForm({ ...structureForm, open: false });
      const updated = await careersApi.findAll();
      setCareers(updated);
      if (career) loadData(career);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar estructura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pensum de Carreras</h1>
            <p className="text-gray-500">Organice el plan de estudios por año y semestre</p>
          </div>
          {selectedCareer && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Carrera</label>
                <SearchableSelect
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {careers.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </SearchableSelect>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setStructureForm({
                    open: true,
                    years: String(selectedCareer.years),
                    semesters: String(selectedCareer.semestersPerYear),
                  })
                }
              >
                <Layers size={16} className="mr-2" />
                Estructura ({selectedCareer.years} años x {selectedCareer.semestersPerYear} sem)
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {pensum && (
              <p className="text-sm text-gray-500">
                Total: {pensum.totalSubjects} materias / {pensum.totalCredits} créditos
              </p>
            )}
            <div className="space-y-8">
              {pensum?.years.map((yr) => (
                <div key={yr.year}>
                  <h2 className="mb-3 text-lg font-bold text-gray-800">Año {yr.year}</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {yr.semesters.map((sem) => (
                      <Card key={sem.semester} title={`Semestre ${sem.semester}`}>
                        <div className="space-y-2">
                          {sem.subjects.length === 0 && (
                            <p className="py-4 text-center text-sm text-gray-400">Sin materias asignadas</p>
                          )}
                          {sem.subjects.map((s) => (
                            <div
                              key={s.id}
                              className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                                s.isActive ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-60'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-medium">
                                  <span className="text-upam-primary">{s.code}</span> - {s.name}
                                </p>
                                <p className="text-xs text-gray-500">{s.credits} créditos</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Button size="sm" variant="secondary" onClick={() => openEdit(s)} title="Mover de año/semestre">
                                  <Pencil size={14} />
                                </Button>
                                {s.isActive ? (
                                  <Button size="sm" variant="danger" onClick={() => handleDeactivate(s)} title="Desactivar">
                                    <Trash2 size={14} />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleActivate(s)} title="Reactivar">
                                    <RotateCcw size={14} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          <Button size="sm" variant="ghost" className="w-full" onClick={() => openCreate(yr.year, sem.semester)}>
                            <Plus size={14} className="mr-1" /> Agregar materia
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editForm}
        onClose={() => setEditForm(null)}
        title={`Mover materia - ${editForm?.subject?.code || ''}`}
      >
        {editForm && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              {editForm.subject.code} - {editForm.subject.name} ({editForm.subject.credits} créditos)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Año *"
                type="number"
                min="1"
                max="5"
                value={editForm.year}
                onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                required
              />
              <Input
                label="Semestre *"
                type="number"
                min="1"
                max="2"
                value={editForm.semester}
                onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditForm(null)}>Cancelar</Button>
              <Button type="submit" loading={saving}>Guardar</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Structure modal */}
      <Modal
        isOpen={structureForm.open}
        onClose={() => setStructureForm({ ...structureForm, open: false })}
        title={`Estructura del pensum - ${selectedCareer?.name || ''}`}
      >
        {selectedCareer && (
          <form onSubmit={handleStructureSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Define cuántos años y semestres tiene el pensum. Las materias fuera del rango no se muestran.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total de años *"
                type="number"
                min="1"
                max="10"
                value={structureForm.years}
                onChange={(e) => setStructureForm({ ...structureForm, years: e.target.value })}
                required
              />
              <Input
                label="Semestres por año *"
                type="number"
                min="1"
                max="4"
                value={structureForm.semesters}
                onChange={(e) => setStructureForm({ ...structureForm, semesters: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setStructureForm({ ...structureForm, open: false })}>Cancelar</Button>
              <Button type="submit" loading={saving}>Guardar Estructura</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        isOpen={createForm.open}
        onClose={() => setCreateForm({ ...createForm, open: false })}
        title={`Nueva materia - Año ${createForm.year}, Semestre ${createForm.semester}`}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Código *"
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
              placeholder="Ej. MAT102"
              required
            />
            <Input
              label="Créditos *"
              type="number"
              min="1"
              max="10"
              value={createForm.credits}
              onChange={(e) => setCreateForm({ ...createForm, credits: e.target.value })}
              required
            />
          </div>
          <Input
            label="Nombre *"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Ej. Calculo I"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Año *"
              type="number"
              min="1"
              max="5"
              value={createForm.year}
              onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
              required
            />
            <Input
              label="Semestre *"
              type="number"
              min="1"
              max="2"
              value={createForm.semester}
              onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateForm({ ...createForm, open: false })}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear Materia</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
