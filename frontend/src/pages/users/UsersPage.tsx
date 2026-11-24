import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useDialog } from '@/context/DialogContext';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { usersApi } from '@/api/users.api';
import { User, UserRole, CreateUserData, UpdateUserData, ROLE_LABELS } from '@/types';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, KeyRound } from 'lucide-react';

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: UserRole.STUDENT,
  career: 'Ingeniería en Sistemas',
  carnet: '',
};

export function UsersPage() {
  const { confirm } = useDialog();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: UserRole.STUDENT, password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await usersApi.findAll((roleFilter || undefined) as UserRole | undefined);
      setUsers(data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: CreateUserData = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        career: form.role === UserRole.STUDENT ? form.career : undefined,
        carnet: form.role === UserRole.STUDENT ? form.carnet : undefined,
      };
      await usersApi.create(payload);
      toast.success('Usuario creado exitosamente');
      setShowCreateModal(false);
      setForm(emptyForm);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role, password: '' });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload: UpdateUserData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
      };
      if (editForm.password) payload.password = editForm.password;
      await usersApi.update(editingUser.id, payload);
      toast.success('Usuario actualizado');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    if (u.role === UserRole.ADMINISTRATOR && u.isActive) {
      toast.error('No puede desactivar una cuenta de administrador');
      return;
    }
    const action = u.isActive ? 'desactivar' : 'reactivar';
    if (!(await confirm(`¿${action === 'desactivar' ? 'Desactivar' : 'Reactivar'} la cuenta de ${u.firstName} ${u.lastName}?`, { confirmText: action === 'desactivar' ? 'Desactivar' : 'Reactivar', danger: u.isActive }))) return;
    try {
      await usersApi.update(u.id, { isActive: !u.isActive });
      toast.success(`Cuenta ${action === 'desactivar' ? 'desactivada' : 'reactivada'}`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar usuario');
    }
  };

  const handleDelete = async (u: User) => {
    if (!(await confirm(`¿Desactivar la cuenta de ${u.firstName} ${u.lastName} (${u.email})?`))) return;
    try {
      await usersApi.remove(u.id);
      toast.success('Cuenta desactivada');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al desactivar cuenta');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-500">Cuentas del sistema (solo administradores)</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-2" /> Nuevo Usuario
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-upam-primary focus:outline-none"
            />
          </div>
          <SearchableSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos los roles</option>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </SearchableSelect>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-upam-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">No hay usuarios registrados</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {u.firstName} {u.lastName}
                        {currentUser?.id === u.id && (
                          <span className="ml-2 text-xs text-gray-400">(tu)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge status={u.role === UserRole.ADMINISTRATOR ? 'completed' : 'pending'} label={ROLE_LABELS[u.role]} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={u.isActive ? 'active' : 'failed'} label={u.isActive ? 'Activo' : 'Inactivo'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(u)} title="Editar">
                            <Pencil size={14} />
                          </Button>
                          {u.isActive ? (
                            <Button size="sm" variant="danger" onClick={() => handleDelete(u)} title="Desactivar">
                              <Trash2 size={14} />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleToggleActive(u)} title="Reactivar">
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
          </Card>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Usuario" size="lg">
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
            label="Correo electrónico *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="usuario@upam.edu.sv"
            required
          />
          <Input
            label="Contraseña *"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rol *</label>
            <SearchableSelect
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </SearchableSelect>
          </div>
          {form.role === UserRole.STUDENT && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Carrera"
                value={form.career}
                onChange={(e) => setForm({ ...form, career: e.target.value })}
                placeholder="Ingeniería en Sistemas"
              />
              <Input
                label="Carnet"
                value={form.carnet}
                onChange={(e) => setForm({ ...form, carnet: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear Usuario</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar Usuario - ${editingUser?.email || ''}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rol *</label>
            <SearchableSelect
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </SearchableSelect>
          </div>
          <Input
            label="Nueva contraseña (dejar vacio para no cambiar)"
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
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
