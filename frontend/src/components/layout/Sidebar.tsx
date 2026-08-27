import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  Settings,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pagos', icon: CreditCard, label: 'Pagos' },
  { to: '/inscripcion', icon: BookOpen, label: 'Inscripcion de Materias', roles: [UserRole.STUDENT] },
  { to: '/mis-materias', icon: GraduationCap, label: 'Mis Materias', roles: [UserRole.STUDENT] },
  { to: '/historial', icon: FileText, label: 'Historial', roles: [UserRole.STUDENT] },
  { to: '/estudiantes', icon: Users, label: 'Estudiantes', roles: [UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE] },
  { to: '/ciclos', icon: Calendar, label: 'Ciclos', roles: [UserRole.ADMINISTRATOR] },
  { to: '/reportes', icon: BarChart3, label: 'Reportes', roles: [UserRole.ADMINISTRATOR, UserRole.COLLECTOR, UserRole.ADMINISTRATIVE] },
];

export function Sidebar() {
  const { user, hasRole } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.roles || hasRole(...item.roles),
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-upam-primary text-white">
      <div className="flex h-16 items-center justify-center border-b border-white/10">
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-wide">UPAM</h1>
          <p className="text-xs text-blue-200">Registro Academico</p>
        </div>
      </div>

      <nav className="mt-4 space-y-1 px-3">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-blue-200 truncate capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
