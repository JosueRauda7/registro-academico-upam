import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { studentsApi } from '@/api/students.api';
import { subjectsApi } from '@/api/subjects.api';
import { legacySubjectsApi } from '@/api/legacySubjects.api';
import { Student, Subject, LegacyCompletedSubject } from '@/types';
import toast from 'react-hot-toast';
import { BookOpenCheck, Trash2, Pencil } from 'lucide-react';

interface FormState {
  subjectId?: string;
  score: string;
  year: string;
  semester: string;
  notes: string;
}

const emptyForm: FormState = { subjectId: '', score: '', year: '', semester: '', notes: '' };

export function LegacySubjectsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentId, setStudentId] = useState('');
  const [records, setRecords] = useState<LegacyCompletedSubject[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<LegacyCompletedSubject | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const [s, subs] = await Promise.all([studentsApi.findAll(), subjectsApi.findAll()]);
      setStudents(s);
      setSubjects(subs);
    } catch (err) {
      toast.error('Error al cargar estudiantes y materias');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (sid: string) => {
    if (!sid) {
      setRecords([]);
      return;
    }
    try {
      const data = await legacySubjectsApi.findAll(sid);
      setRecords(data);
    } catch (err) {
      toast.error('Error al cargar las materias del estudiante');
    }
  };

  const handleSelectStudent = (sid: string) => {
    setStudentId(sid);
    setForm(emptyForm);
    loadRecords(sid);
  };

  const selectedStudent = students.find((s) => s.id === studentId);
  const careerSubjects = selectedStudent
    ? subjects.filter((s) => s.career === selectedStudent.career && s.isActive)
    : [];
  const takenSubjectIds = new Set(records.map((r) => r.subjectId));
  const availableSubjects = careerSubjects.filter((s) => !takenSubjectIds.has(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error('Selecciona un estudiante');
      return;
    }
    const score = Number(form.score);
    if (!form.subjectId) {
      toast.error('Selecciona una materia');
      return;
    }
    if (Number.isNaN(score) || score < 0 || score > 10) {
      toast.error('La nota debe ser un numero entre 0 y 10');
      return;
    }
    setSaving(true);
    try {
      await legacySubjectsApi.register({
        studentId,
        subjectId: form.subjectId,
        score,
        year: form.year ? Number(form.year) : null,
        semester: form.semester ? Number(form.semester) : null,
        notes: form.notes || null,
      });
      toast.success('Materia registrada exitosamente');
      setForm(emptyForm);
      loadRecords(studentId);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al registrar materia');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (record: LegacyCompletedSubject) => {
    setEditing(record);
    setEditForm({
      score: String(record.score),
      year: record.year != null ? String(record.year) : '',
      semester: record.semester != null ? String(record.semester) : '',
      notes: record.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const score = Number(editForm.score);
    if (Number.isNaN(score) || score < 0 || score > 10) {
      toast.error('La nota debe ser un numero entre 0 y 10');
      return;
    }
    setSaving(true);
    try {
      await legacySubjectsApi.update(editing.id, {
        score,
        year: editForm.year ? Number(editForm.year) : null,
        semester: editForm.semester ? Number(editForm.semester) : null,
        notes: editForm.notes || null,
      });
      toast.success('Materia actualizada');
      setShowEditModal(false);
      loadRecords(studentId);
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: LegacyCompletedSubject) => {
    if (!window.confirm(`¿Eliminar la materia ${record.subjectName} de este estudiante?`)) return;
    try {
      await legacySubjectsApi.remove(record.id);
      toast.success('Materia eliminada');
      loadRecords(studentId);
    } catch (err) {
      toast.error('Error al eliminar la materia');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BookOpenCheck className="text-upam-primary" size={26} />
            Materias Previas
          </h1>
          <p className="text-gray-500">
            Registra las materias que los estudiantes cursaron antes de la creacion del sistema.
            Estas materias se incluyen en el CUM del estudiante.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Lista + formulario */}
          <div className="lg:col-span-1">
            <Card title="Nuevo registro" subtitle="Materia cursada previo al sistema">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estudiante *</label>
                  <select
                    value={studentId}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona un estudiante</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.carnet} - {s.user.firstName} {s.user.lastName} ({s.career})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Materia *</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    disabled={!selectedStudent}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                  >
                    <option value="">
                      {selectedStudent ? 'Selecciona una materia' : 'Primero selecciona un estudiante'}
                    </option>
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.credits} creditos)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nota *</label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step="0.01"
                    placeholder="0 - 10"
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ano (opcional)"
                    type="number"
                    placeholder="2025"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                  <Input
                    label="Semestre (opcional)"
                    type="number"
                    min={1}
                    max={2}
                    placeholder="1"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  />
                </div>

                <Input
                  label="Observaciones (opcional)"
                  placeholder="Ej: Cursada en otra institucion"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />

                <Button type="submit" loading={saving} className="w-full">
                  Guardar Materia
                </Button>
              </form>
            </Card>
          </div>

          {/* Tabla de materias registradas */}
          <div className="lg:col-span-2">
            <Card title="Materias registradas" subtitle={selectedStudent ? `Estudiante: ${selectedStudent.carnet} - ${selectedStudent.user.firstName} ${selectedStudent.user.lastName}` : 'Selecciona un estudiante'}>
              {!studentId ? (
                <div className="py-8 text-center text-gray-500">
                  <BookOpenCheck size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Selecciona un estudiante para ver sus materias cursadas</p>
                </div>
              ) : loading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
                </div>
              ) : records.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>Este estudiante no tiene materias previas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 font-medium">Materia</th>
                        <th className="pb-3 font-medium">Creditos</th>
                        <th className="pb-3 font-medium">Nota</th>
                        <th className="pb-3 font-medium">Estado</th>
                        <th className="pb-3 font-medium">Ano/Semestre</th>
                        <th className="pb-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="py-3">
                            <p className="font-medium text-gray-900">{r.subjectName}</p>
                            <p className="text-xs text-gray-400">{r.code}</p>
                          </td>
                          <td className="py-3">{r.credits}</td>
                          <td className="py-3 font-semibold">{Number(r.score).toFixed(2)}</td>
                          <td className="py-3">
                            <Badge status={r.status === 'approved' ? 'approved' : 'failed'} label={r.status === 'approved' ? 'Aprobada' : 'Reprobada'} />
                          </td>
                          <td className="py-3">
                            {r.year ? `${r.year}${r.semester ? ` / S${r.semester}` : ''}` : '-'}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEdit(r)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-upam-primary"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(r)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
      </div>

      {/* Edit modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar materia - ${editing?.subjectName || ''}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Nota *"
            type="number"
            min={0}
            max={10}
            step="0.01"
            value={editForm.score}
            onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ano (opcional)"
              type="number"
              value={editForm.year}
              onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
            />
            <Input
              label="Semestre (opcional)"
              type="number"
              min={1}
              max={2}
              value={editForm.semester}
              onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
            />
          </div>
          <Input
            label="Observaciones (opcional)"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
