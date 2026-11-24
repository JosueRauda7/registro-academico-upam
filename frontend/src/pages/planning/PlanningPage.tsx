import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useDialog } from '@/context/DialogContext';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cyclesApi } from '@/api/cycles.api';
import { subjectsApi } from '@/api/subjects.api';
import { teachersApi } from '@/api/teachers.api';
import { classroomsApi } from '@/api/classrooms.api';
import { subjectGroupsApi } from '@/api/subjectGroups.api';
import { Cycle, Subject, Teacher, Classroom, SubjectGroup } from '@/types';
import { getDayName, formatTime } from '@/utils/formatDate';
import toast from 'react-hot-toast';
import { Plus, Users, Building2, CalendarDays, Trash2, Pencil, DoorOpen } from 'lucide-react';

type Tab = 'groups' | 'teachers' | 'classrooms';

export function PlanningPage() {
  const { confirm } = useDialog();
  const [tab, setTab] = useState<Tab>('groups');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [loading, setLoading] = useState(true);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [scheduleGroupId, setScheduleGroupId] = useState('');

  const [groupForm, setGroupForm] = useState({
    subjectId: '',
    teacherId: '',
    classroomId: '',
    capacity: '',
    schedules: [{ dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' }],
  });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', phone: '', department: '' });
  const [classroomForm, setClassroomForm] = useState({ name: '', building: '', capacity: '' });
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycle) loadGroups();
  }, [selectedCycle]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cyclesData, subjectsData, teachersData, classroomsData] = await Promise.all([
        cyclesApi.findAll(),
        subjectsApi.findAll(),
        teachersApi.findAll(),
        classroomsApi.findAll(),
      ]);
      setCycles(cyclesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setClassrooms(classroomsData);
      if (cyclesData.length > 0) setSelectedCycle(cyclesData[0].id);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groupsData = await subjectGroupsApi.findAll(selectedCycle);
      setGroups(groupsData);
    } catch {
      toast.error('Error al cargar grupos');
    }
  };

  const loadTeachers = async () => {
    try {
      setTeachers(await teachersApi.findAll());
    } catch {
      toast.error('Error al cargar docentes');
    }
  };

  const loadClassrooms = async () => {
    try {
      setClassrooms(await classroomsApi.findAll());
    } catch {
      toast.error('Error al cargar salones');
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    if (t === 'teachers') loadTeachers();
    if (t === 'classrooms') loadClassrooms();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subjectGroupsApi.create({
        subjectId: groupForm.subjectId,
        cycleId: selectedCycle,
        teacherId: groupForm.teacherId || null,
        classroomId: groupForm.classroomId,
        capacity: parseInt(groupForm.capacity) || undefined,
        schedules: groupForm.schedules,
      });
      toast.success('Grupo creado exitosamente');
      setShowGroupModal(false);
      setGroupForm({ subjectId: '', teacherId: '', classroomId: '', capacity: '', schedules: [{ dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' }] });
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear grupo');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await subjectGroupsApi.update(editingGroup.id, {
        teacherId: groupForm.teacherId || null,
        classroomId: groupForm.classroomId,
        capacity: parseInt(groupForm.capacity) || undefined,
      });
      toast.success('Grupo actualizado (incluye cambio de salón/docente)');
      setShowGroupModal(false);
      setEditingGroup(null);
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar grupo');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!(await confirm('¿Eliminar este grupo? Se eliminarán sus horarios.'))) return;
    try {
      await subjectGroupsApi.remove(id);
      toast.success('Grupo eliminado');
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al eliminar grupo');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subjectGroupsApi.addSchedule(scheduleGroupId, scheduleForm);
      toast.success('Horario agregado');
      setShowScheduleModal(false);
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al agregar horario');
    }
  };

  const handleDeleteSchedule = async (groupId: string, scheduleId: string) => {
    if (!(await confirm('¿Eliminar este horario?'))) return;
    try {
      await subjectGroupsApi.removeSchedule(groupId, scheduleId);
      toast.success('Horario eliminado');
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al eliminar horario');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teachersApi.create(teacherForm);
      toast.success('Docente creado');
      setShowTeacherModal(false);
      setTeacherForm({ name: '', email: '', phone: '', department: '' });
      loadTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear docente');
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      await teachersApi.update(editingTeacher.id, teacherForm);
      toast.success('Docente actualizado');
      setShowTeacherModal(false);
      setEditingTeacher(null);
      loadTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar docente');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!(await confirm('¿Desactivar este docente?'))) return;
    try {
      await teachersApi.remove(id);
      toast.success('Docente desactivado');
      loadTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al desactivar docente');
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classroomsApi.create({
        name: classroomForm.name,
        building: classroomForm.building,
        capacity: parseInt(classroomForm.capacity),
      });
      toast.success('Salón creado');
      setShowClassroomModal(false);
      setClassroomForm({ name: '', building: '', capacity: '' });
      loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al crear salón');
    }
  };

  const handleUpdateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom) return;
    try {
      await classroomsApi.update(editingClassroom.id, {
        name: classroomForm.name,
        building: classroomForm.building,
        capacity: parseInt(classroomForm.capacity),
      });
      toast.success('Salón actualizado');
      setShowClassroomModal(false);
      setEditingClassroom(null);
      loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al actualizar salón');
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!(await confirm('¿Desactivar este salón?'))) return;
    try {
      await classroomsApi.remove(id);
      toast.success('Salón desactivado');
      loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al desactivar salón');
    }
  };

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({ subjectId: '', teacherId: '', classroomId: '', capacity: '', schedules: [{ dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' }] });
    setShowGroupModal(true);
  };

  const openEditGroup = (group: SubjectGroup) => {
    setEditingGroup(group);
    setGroupForm({
      subjectId: group.subjectId,
      teacherId: group.teacherId || '',
      classroomId: group.classroomId,
      capacity: String(group.capacity),
      schedules: group.schedules || [],
    });
    setShowGroupModal(true);
  };

  const openCreateTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({ name: '', email: '', phone: '', department: '' });
    setShowTeacherModal(true);
  };

  const openEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setTeacherForm({ name: t.name, email: t.email, phone: t.phone, department: t.department });
    setShowTeacherModal(true);
  };

  const openCreateClassroom = () => {
    setEditingClassroom(null);
    setClassroomForm({ name: '', building: '', capacity: '' });
    setShowClassroomModal(true);
  };

  const openEditClassroom = (c: Classroom) => {
    setEditingClassroom(c);
    setClassroomForm({ name: c.name, building: c.building, capacity: String(c.capacity) });
    setShowClassroomModal(true);
  };

  const openAddSchedule = (groupId: string) => {
    setScheduleGroupId(groupId);
    setScheduleForm({ dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' });
    setShowScheduleModal(true);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Planificación Academica</h1>
          <p className="text-gray-500">Gestión de grupos, horarios, salones y docentes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => switchTab('groups')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'groups' ? 'bg-white text-upam-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarDays size={16} /> Grupos y Horarios
          </button>
          <button
            onClick={() => switchTab('teachers')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'teachers' ? 'bg-white text-upam-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={16} /> Docentes
          </button>
          <button
            onClick={() => switchTab('classrooms')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'classrooms' ? 'bg-white text-upam-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 size={16} /> Salones
          </button>
        </div>

        {/* Groups tab */}
        {tab === 'groups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SearchableSelect
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-upam-primary focus:outline-none"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.year}</option>
                ))}
              </SearchableSelect>
              <Button onClick={openCreateGroup}>
                <Plus size={16} className="mr-2" /> Nuevo Grupo
              </Button>
            </div>

            {groups.length === 0 ? (
              <Card>
                <p className="py-8 text-center text-gray-500">
                  No hay grupos para este ciclo. Cree el primer grupo de una materia.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {groups.map((group) => (
                  <Card key={group.id}>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {group.subject?.code} - {group.subject?.name}
                        </p>
                        <p className="text-sm text-gray-500">Grupo {group.groupNumber}</p>
                      </div>
                      <Badge status={group.enrolledCount >= group.capacity ? 'failed' : 'active'} label={`${group.enrolledCount}/${group.capacity} cupos`} />
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        {group.teacher?.name || 'Sin docente asignado'}
                      </p>
                      <p className="flex items-center gap-2">
                        <DoorOpen size={14} className="text-gray-400" />
                        {group.classroom?.name} ({group.classroom?.building || 'Sin edificio'} - capacidad {group.classroom?.capacity})
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">Horarios</p>
                      <div className="space-y-1">
                        {group.schedules?.map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                            <span>
                              {getDayName(s.dayOfWeek)} {formatTime(s.startTime)} - {formatTime(s.endTime)}
                            </span>
                            <button
                              onClick={() => handleDeleteSchedule(group.id, s.id)}
                              className="text-red-400 hover:text-red-600"
                              title="Eliminar horario"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(!group.schedules || group.schedules.length === 0) && (
                          <p className="text-sm text-gray-400">Sin horarios asignados</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAddSchedule(group.id)}>
                        <Plus size={14} className="mr-1" /> Horario
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openEditGroup(group)}>
                        <Pencil size={14} className="mr-1" /> Editar (Salón/Docente)
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 size={14} className="mr-1" /> Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Teachers tab */}
        {tab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreateTeacher}>
                <Plus size={16} className="mr-2" /> Nuevo Docente
              </Button>
            </div>
            {teachers.length === 0 ? (
              <Card><p className="py-8 text-center text-gray-500">No hay docentes registrados</p></Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teachers.map((t) => (
                  <Card key={t.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-gray-500">{t.department || '-'}</p>
                      </div>
                      <Badge status={t.isActive ? 'active' : 'failed'} label={t.isActive ? 'Activo' : 'Inactivo'} />
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>{t.email || 'Sin email'}</p>
                      <p>{t.phone || 'Sin teléfono'}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditTeacher(t)}>
                        <Pencil size={14} className="mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteTeacher(t.id)}>
                        <Trash2 size={14} className="mr-1" /> Desactivar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Classrooms tab */}
        {tab === 'classrooms' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreateClassroom}>
                <Plus size={16} className="mr-2" /> Nuevo Salón
              </Button>
            </div>
            {classrooms.length === 0 ? (
              <Card><p className="py-8 text-center text-gray-500">No hay salones registrados</p></Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classrooms.map((c) => (
                  <Card key={c.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-gray-500">{c.building || '-'}</p>
                      </div>
                      <Badge status={c.isActive ? 'active' : 'failed'} label={c.isActive ? 'Activo' : 'Inactivo'} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Capacidad: <span className="font-semibold">{c.capacity} estudiantes</span>
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditClassroom(c)}>
                        <Pencil size={14} className="mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteClassroom(c.id)}>
                        <Trash2 size={14} className="mr-1" /> Desactivar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Modal */}
      <Modal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} title={editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'} size="lg">
        <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
          {!editingGroup && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Materia *</label>
                <SearchableSelect
                  value={groupForm.subjectId}
                  onChange={(e) => setGroupForm({ ...groupForm, subjectId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar materia</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </SearchableSelect>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ciclo</label>
                <input
                  type="text"
                  value={cycles.find((c) => c.id === selectedCycle)?.name || ''}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Docente</label>
            <SearchableSelect
              value={groupForm.teacherId}
              onChange={(e) => setGroupForm({ ...groupForm, teacherId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Sin docente</option>
              {teachers.filter(t => t.isActive || t.id === groupForm.teacherId).map((t) => (
                <option key={t.id} value={t.id} disabled={!t.isActive}>{t.name}{!t.isActive ? ' (Inactivo)' : ''}</option>
              ))}
            </SearchableSelect>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Salón *</label>
            <SearchableSelect
              value={groupForm.classroomId}
              onChange={(e) => setGroupForm({ ...groupForm, classroomId: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar salón</option>
              {classrooms.filter(c => c.isActive || c.id === groupForm.classroomId).map((c) => (
                <option key={c.id} value={c.id} disabled={!c.isActive}>{c.name} (Capacidad {c.capacity}){!c.isActive ? ' (Inactivo)' : ''}</option>
              ))}
            </SearchableSelect>
            <p className="mt-1 text-xs text-gray-500">
              Solo se asignan docentes y salones activos, sin cruces de horario. La capacidad no puede exceder la del salón.
            </p>
          </div>
          <Input
            label="Capacidad (Cupos)"
            type="number"
            min="1"
            value={groupForm.capacity}
            onChange={(e) => setGroupForm({ ...groupForm, capacity: e.target.value })}
            placeholder="Si se deja vacio, usa la capacidad del salón"
          />

          {!editingGroup && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Horarios *</label>
              <div className="space-y-2">
                {groupForm.schedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <SearchableSelect
                      value={s.dayOfWeek}
                      onChange={(e) => {
                        const schedules = [...groupForm.schedules];
                        schedules[i] = { ...schedules[i], dayOfWeek: e.target.value };
                        setGroupForm({ ...groupForm, schedules });
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    >
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((d) => (
                        <option key={d} value={d}>{getDayName(d)}</option>
                      ))}
                    </SearchableSelect>
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => {
                        const schedules = [...groupForm.schedules];
                        schedules[i] = { ...schedules[i], startTime: e.target.value };
                        setGroupForm({ ...groupForm, schedules });
                      }}
                      className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => {
                        const schedules = [...groupForm.schedules];
                        schedules[i] = { ...schedules[i], endTime: e.target.value };
                        setGroupForm({ ...groupForm, schedules });
                      }}
                      className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                    />
                    {groupForm.schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGroupForm({ ...groupForm, schedules: groupForm.schedules.filter((_, idx) => idx !== i) })}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setGroupForm({ ...groupForm, schedules: [...groupForm.schedules, { dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' }] })}
                >
                  <Plus size={14} className="mr-1" /> Agregar Horario
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowGroupModal(false)}>Cancelar</Button>
            <Button type="submit">{editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}</Button>
          </div>
        </form>
      </Modal>

      {/* Teacher Modal */}
      <Modal isOpen={showTeacherModal} onClose={() => setShowTeacherModal(false)} title={editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}>
        <form onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher} className="space-y-4">
          <Input
            label="Nombre *"
            value={teacherForm.name}
            onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={teacherForm.email}
            onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            value={teacherForm.phone}
            onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
          />
          <Input
            label="Departamento"
            value={teacherForm.department}
            onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowTeacherModal(false)}>Cancelar</Button>
            <Button type="submit">{editingTeacher ? 'Guardar Cambios' : 'Crear Docente'}</Button>
          </div>
        </form>
      </Modal>

      {/* Classroom Modal */}
      <Modal isOpen={showClassroomModal} onClose={() => setShowClassroomModal(false)} title={editingClassroom ? 'Editar Salón' : 'Nuevo Salón'}>
        <form onSubmit={editingClassroom ? handleUpdateClassroom : handleCreateClassroom} className="space-y-4">
          <Input
            label="Nombre *"
            value={classroomForm.name}
            onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
            placeholder="Ej. Aula 101"
            required
          />
          <Input
            label="Edificio"
            value={classroomForm.building}
            onChange={(e) => setClassroomForm({ ...classroomForm, building: e.target.value })}
            placeholder="Ej. Edificio A"
          />
          <Input
            label="Capacidad *"
            type="number"
            min="1"
            value={classroomForm.capacity}
            onChange={(e) => setClassroomForm({ ...classroomForm, capacity: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowClassroomModal(false)}>Cancelar</Button>
            <Button type="submit">{editingClassroom ? 'Guardar Cambios' : 'Crear Salón'}</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Agregar Horario">
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Dia *</label>
            <SearchableSelect
              value={scheduleForm.dayOfWeek}
              onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((d) => (
                <option key={d} value={d}>{getDayName(d)}</option>
              ))}
            </SearchableSelect>
          </div>
          <div className="flex gap-3">
            <Input
              label="Inicio *"
              type="time"
              value={scheduleForm.startTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
              required
            />
            <Input
              label="Fin *"
              type="time"
              value={scheduleForm.endTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
            <Button type="submit">Agregar Horario</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
