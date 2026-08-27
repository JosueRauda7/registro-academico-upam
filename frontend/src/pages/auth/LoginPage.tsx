import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido a UPAM');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message?.[0] || 'Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-upam-primary lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold tracking-tight">UPAM</h1>
          <p className="mt-4 text-xl text-blue-200">Universidad Panamericana de El Salvador</p>
          <div className="mt-8 space-y-2 text-blue-100">
            <p>Sistema de Registro Academico</p>
            <p className="text-sm">Matricula e Inscripcion de Materias</p>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <h1 className="text-3xl font-bold text-upam-primary">UPAM</h1>
            <p className="text-sm text-gray-500">Registro Academico</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesion</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electronico"
              type="email"
              placeholder="tu@upam.edu.sv"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Contrasena"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-upam-secondary hover:text-upam-primary"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Ingresar
            </Button>
          </form>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Cuentas de prueba:</p>
            <div className="space-y-1 text-xs">
              <p><strong>Admin:</strong> admin@upam.edu.sv / admin123</p>
              <p><strong>Estudiante:</strong> estudiante@upam.edu.sv / estudiante123</p>
              <p><strong>Colector:</strong> colector@upam.edu.sv / colector123</p>
              <p><strong>Administrativo:</strong> administrativo@upam.edu.sv / adminstaff123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
