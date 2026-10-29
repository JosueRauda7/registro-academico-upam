import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Si el correo existe, se ha enviado un enlace de recuperación');
    } catch (error: any) {
      toast.error('Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-upam-primary">UPAM</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Recuperar Contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>
        {sent ? (
          <div className="rounded-lg bg-green-50 p-6 text-center">
            <p className="text-green-800">
              Si el correo electrónico está registrado, recibirá un enlace para restablecer su contraseña.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-sm text-upam-secondary hover:text-upam-primary"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@upam.edu.sv"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Enviar enlace de recuperación
            </Button>
            <Link
              to="/login"
              className="block text-center text-sm text-upam-secondary hover:text-upam-primary"
            >
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
