import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { LogOut, Bell, Menu, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const { branding } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
          {branding.institutionName || 'Universidad Panamericana de El Salvador'}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700" aria-label="Notificaciones">
          <Bell size={20} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button
          onClick={() => navigate('/cambiar-contrasena')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-upam-primary"
          title="Cambiar contrasena"
        >
          <Lock size={18} />
          <span className="hidden sm:inline">Cambiar contrasena</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Cerrar sesion</span>
        </button>
      </div>
    </header>
  );
}
