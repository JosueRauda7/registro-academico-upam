import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, ShieldCheck, GraduationCap, BookOpen, BarChart3 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { branding } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido al sistema');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message?.[0] || 'Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel lateral (branding) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-upam-primary lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-upam-secondary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-upam-accent/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3 px-12 pt-10 text-white">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 font-bold text-xl">
              UP
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-wide">{branding.institutionName || 'UPAM'}</h1>
            <p className="text-xs text-blue-200">Registro Academico</p>
          </div>
        </div>

        <div className="relative z-10 px-12 text-white">
          <h2 className="text-4xl font-bold leading-tight">
            Gestiona todo el proceso
            <br />
            <span className="text-blue-200">academico de la universidad</span>
          </h2>
          <p className="mt-4 max-w-md text-blue-100">
            Matricula, inscripcion de materias, pagos, notas y reportes en un solo sistema.
          </p>
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="font-medium">Inscripcion de materias</p>
                <p className="text-sm text-blue-200">Validacion de prerrequisitos y cupos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="font-medium">Notas y CUM</p>
                <p className="text-sm text-blue-200">Registro por docentes y consulta del estudiante</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="font-medium">Reportes en Excel y PDF</p>
                <p className="text-sm text-blue-200">Para administracion y docencia</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-10 text-xs text-blue-200">
          {branding.institutionName || 'Universidad Panamericana de El Salvador'} © {new Date().getFullYear()}
        </div>
      </div>

      {/* Formulario */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Logo (movil) */}
          <div className="text-center lg:hidden">
            <div className="mb-3 flex items-center justify-center gap-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-upam-primary font-bold text-white">
                  UP
                </div>
              )}
              <h1 className="text-2xl font-bold text-upam-primary">{branding.institutionName || 'UPAM'}</h1>
            </div>
            <p className="text-sm text-gray-500">Registro Academico</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesion</h2>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="tu@upam.edu.sv"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-upam-primary focus:outline-none focus:ring-2 focus:ring-upam-primary/20"
                  required
                />
              </div>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-upam-primary focus:outline-none focus:ring-2 focus:ring-upam-primary/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-upam-secondary transition hover:text-upam-primary"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                <LogIn size={18} className="mr-2" />
                Ingresar
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <ShieldCheck size={14} />
                Cuentas de prueba
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-600">
                <p><strong className="text-gray-700">Admin:</strong> admin@upam.edu.sv / admin123</p>
                <p><strong className="text-gray-700">Estudiante:</strong> estudiante@upam.edu.sv / estudiante123</p>
                <p><strong className="text-gray-700">Docente:</strong> docente@upam.edu.sv / docente123</p>
                <p><strong className="text-gray-700">Colector:</strong> colector@upam.edu.sv / colector123</p>
                <p><strong className="text-gray-700">Administrativo:</strong> administrativo@upam.edu.sv / adminstaff123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            {branding.institutionName || 'Universidad Panamericana de El Salvador'} - Sistema de Registro Academico
          </p>
        </div>
      </div>
    </div>
  );
}