import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contrasenas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      toast.success('Contrasena actualizada exitosamente');
      navigate('/login');
    } catch (error: any) {
      toast.error('Token invalido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-upam-primary">UPAM</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Nueva Contrasena</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nueva contrasena"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirmar contrasena"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Restablecer contrasena
          </Button>
          <Link
            to="/login"
            className="block text-center text-sm text-upam-secondary hover:text-upam-primary"
          >
            Volver al login
          </Link>
        </form>
      </div>
    </div>
  );
}
