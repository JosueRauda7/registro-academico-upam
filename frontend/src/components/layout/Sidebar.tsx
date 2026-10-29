import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  CreditCard,
  BookOpen,
  FileText,
  Users,
  GraduationCap,
  Calendar,
  BarChart3,
  Banknote,
  CalendarClock,
  CalendarRange,
  Settings,
  Library,
  BookMarked,
  ClipboardList,
  BookOpenCheck,
  X,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pagos', icon: CreditCard, label: 'Pagos', roles: [UserRole.STUDENT] },
  { to: '/inscripcion', icon: BookOpen, label: 'Inscripción de Materias', roles: [UserRole.STUDENT] },
  { to: '/horario', icon: CalendarClock, label: 'Mi Horario', roles: [UserRole.STUDENT] },
  { to: '/mi-pensum', icon: ClipboardList, label: 'Mi Pensum', roles: [UserRole.STUDENT] },
  { to: '/mis-materias', icon: GraduationCap, label: 'Mis Materias', roles: [UserRole.STUDENT] },
  { to: '/historial', icon: FileText, label: 'Historial', roles: [UserRole.STUDENT] },
  { to: '/notas-docente', icon: ClipboardList, label: 'Notas de Estudiantes', roles: [UserRole.TEACHER] },
  { to: '/colecturia', icon: Banknote, label: 'Colecturia', roles: [UserRole.COLLECTOR, UserRole.ADMINISTRATOR] },
  { to: '/planificacion', icon: CalendarRange, label: 'Planificación', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/materias', icon: Library, label: 'Materias', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/pensum', icon: BookMarked, label: 'Pensum', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/carreras', icon: GraduationCap, label: 'Carreras', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/estudiantes', icon: Users, label: 'Estudiantes', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/materias-previas', icon: BookOpenCheck, label: 'Materias Previas', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/ciclos', icon: Calendar, label: 'Ciclos', roles: [UserRole.ADMINISTRATOR] },
  { to: '/usuarios', icon: Users, label: 'Usuarios', roles: [UserRole.ADMINISTRATOR] },
  { to: '/configuracion', icon: Settings, label: 'Configuración', roles: [UserRole.ADMINISTRATOR] },
  { to: '/reportes', icon: BarChart3, label: 'Reportes', roles: [UserRole.ADMINISTRATOR, UserRole.COLLECTOR, UserRole.ADMINISTRATIVE, UserRole.TEACHER] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, hasRole, roleLabel } = useAuth();
  const { branding } = useSettings();

  const filteredItems = navItems.filter(
    (item) => !item.roles || hasRole(...item.roles),
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Encabezado con logo */}
      <div className="relative flex h-16 items-center gap-3 border-b border-gray-100 px-4">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-upam-primary font-bold text-white">
            UP
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold tracking-wide text-gray-900">{branding.institutionName || 'UPAM'}</h1>
          <p className="text-xs text-gray-400">Registro Académico</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          aria-label="Cerrar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="mt-4 space-y-1 overflow-y-auto px-3 pb-24"
           style={{ height: 'calc(100vh - 4rem)' }}>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Menu</p>
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-upam-primary to-upam-secondary text-white shadow-md shadow-upam-primary/20'
                  : 'text-gray-600 hover:bg-upam-light hover:text-upam-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={`transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-upam-primary'
                  }`}
                />
                {item.label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4">
        <div className="flex items-center gap-3 rounded-xl bg-upam-light p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-upam-primary text-sm font-bold text-white">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="truncate text-xs font-medium text-upam-secondary capitalize">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
