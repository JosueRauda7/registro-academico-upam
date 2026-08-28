import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { studentsApi } from '@/api/students.api';
import { Student, CreateStudentData, UpdateStudentData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Users, Search, KeyRound, Ban } from 'lucide-react';

const UPAM_EMAIL_DOMAIN = '@upam.edu.sv';

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  career: 'Ingenieria en Sistemas',
  phone: '',
  address: '',
  dateOfBirth: '',
  enrollmentYear: String(new Date().getFullYear()),
};

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  career: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  enrollmentYear: string;
  password: string;
}

function validateEmail(email: string): string | null {
  if (!email.trim().toLowerCase().endsWith(UPAM_EMAIL_DOMAIN)) {
    return `El correo debe pertenecer al dominio ${UPAM_EMAIL_DOMAIN}`;
  }
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 8) {
    return 'El telefono debe tener 8 digitos (formato XXXX-XXXX)';
  }
  return null;
}

function validateDateOfBirth(dob: string): string | null {
  if (!dob) return null;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return 'Fecha de nacimiento invalida';
  const now = new Date();
  if (date > now) return 'La fecha de nacimiento no puede ser futura';
  const age = now.getFullYear() - date.getFullYear();
  const hasHadBirthday =
    now.getMonth() > date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (age < 18 || (age === 18 && !hasHadBirthday)) return 'El estudiante debe ser mayor de 18 anos';
  return null;
}

function validateForm(opts: {
  email: string;
  password?: string;
  phone: string;
  dateOfBirth: string;
}): string | null {
  const emailErr = validateEmail(opts.email);
  if (emailErr) return emailErr;
  if (opts.password !== undefined && opts.password.length > 0 && opts.password.length < 6) {
    return 'La contrasena debe tener al menos 6 caracteres';
  }
  const phoneErr = validatePhone(opts.phone);
  if (phoneErr) return phoneErr;
  return validateDateOfBirth(opts.dateOfBirth);
}

export function StudentsListPage() {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    email: '',
    career: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    enrollmentYear: String(new Date().getFullYear()),
    password: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsApi.findAll();
      setStudents(data);
    } catch {
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.carnet?.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q) ||
        s.career?.toLowerCase().includes(q) ||
        `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q),
    );
  }, [students, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm({ email: form.email, password: form.password, phone: form.phone, dateOfBirth: form.dateOfBirth });
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const payload: CreateStudentData = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        career: form.career || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        enrollmentYear: form.enrollmentYear ? Number(form.enrollmentYear) : undefined,
      };
      const created = await studentsApi.create(payload);
      toast.success(`Estudiante creado (carnet ${created.carnet})`);
      setShowCreateModal(false);
      setForm(emptyForm);
      loadStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear estudiante');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    const dob = s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '';
    setEditForm({
      firstName: s.user?.firstName || '',
      lastName: s.user?.lastName || '',
      email: s.user?.email || '',
      career: s.career || '',
      phone: s.phone || '',
      address: s.address || '',
      dateOfBirth: dob,
      enrollmentYear: String(s.enrollmentYear || new Date().getFullYear()),
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const err = validateForm({ email: editForm.email, password: editForm.password, phone: editForm.phone, dateOfBirth: editForm.dateOfBirth });
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const payload: UpdateStudentData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        career: editForm.career,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
        enrollmentYear: editForm.enrollmentYear ? Number(editForm.enrollmentYear) : undefined,
      };
      if (editForm.password) payload.password = editForm.password;
      await studentsApi.update(editingStudent.id, payload);
      toast.success('Estudiante actualizado');
      setShowEditModal(false);
      loadStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar estudiante');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Student) => {
    const action = s.user?.isActive ? 'desactivar' : 'reactivar';
    if (!confirm(`¿${action === 'desactivar' ? 'Desactivar' : 'Reactivar'} la cuenta de ${s.user?.firstName} ${s.user?.lastName}?`)) return;
    try {
      await studentsApi.update(s.id, { isActive: !s.user?.isActive });
      toast.success(`Cuenta ${action === 'desactivar' ? 'desactivada' : 'reactivada'}`);
      loadStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar estudiante');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion de Estudiantes</h1>
            <p className="text-gray-500">Crear, editar y gestionar estudiantes</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-2" /> Nuevo Estudiante
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por carnet, codigo, nombre, carrera o correo..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-upam-primary focus:outline-none"
          />
        </div>

        <Card>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>{students.length === 0 ? 'No hay estudiantes registrados' : 'Sin resultados'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Carnet</th>
                    <th className="pb-3 font-medium">Codigo</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Carrera</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono">{student.carnet}</td>
                      <td className="py-3 font-mono text-xs">{student.studentCode}</td>
                      <td className="py-3">
                        {student.user?.firstName} {student.user?.lastName}
                        {currentUser?.id === student.user?.id && (
                          <span className="ml-2 text-xs text-gray-400">(tu)</span>
                        )}
                      </td>
                      <td className="py-3">{student.career}</td>
                      <td className="py-3">{student.user?.email}</td>
                      <td className="py-3">
                        <Badge status={student.user?.isActive ? 'active' : 'failed'} label={student.user?.isActive ? 'Activo' : 'Inactivo'} />
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(student)} title="Editar">
                            <Pencil size={14} />
                          </Button>
                          {student.user?.isActive ? (
                            <Button size="sm" variant="danger" onClick={() => handleToggleActive(student)} title="Desactivar">
                              <Ban size={14} />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleToggleActive(student)} title="Reactivar">
                              <KeyRound size={14} />
                            </Button>
                          )}
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

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Estudiante" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre *"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <Input
              label="Apellido *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Correo electronico *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={`usuario${UPAM_EMAIL_DOMAIN}`}
            required
          />
          <Input
            label="Contrasena *"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimo 6 caracteres"
            required
          />
          <Input
            label="Carrera"
            value={form.career}
            onChange={(e) => setForm({ ...form, career: e.target.value })}
            placeholder="Ingenieria en Sistemas"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Telefono (8 digitos)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="7000-0000"
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Ano de ingreso"
              type="number"
              value={form.enrollmentYear}
              onChange={(e) => setForm({ ...form, enrollmentYear: e.target.value })}
            />
            <Input
              label="Direccion"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <p className="text-xs text-gray-500">El carnet y el codigo se generan automaticamente al crear el estudiante.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear Estudiante</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar Estudiante - ${editingStudent?.user?.email || ''}`} size="lg">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="block text-xs font-medium text-gray-500">Carnet (autogenerado)</span>
              <span className="font-mono text-sm text-gray-800">{editingStudent?.carnet}</span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="block text-xs font-medium text-gray-500">Codigo</span>
              <span className="font-mono text-sm text-gray-800">{editingStudent?.studentCode}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre *"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Apellido *"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Correo electronico *"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <Input
            label="Carrera"
            value={editForm.career}
            onChange={(e) => setEditForm({ ...editForm, career: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Telefono (8 digitos)"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="7000-0000"
            />
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={editForm.dateOfBirth}
              onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Ano de ingreso"
              type="number"
              value={editForm.enrollmentYear}
              onChange={(e) => setEditForm({ ...editForm, enrollmentYear: e.target.value })}
            />
            <Input
              label="Direccion"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
          <Input
            label="Nueva contrasena (dejar vacio para no cambiar)"
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            placeholder="Minimo 6 caracteres"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
