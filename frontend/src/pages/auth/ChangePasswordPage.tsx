import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, MailCheck } from 'lucide-react';

export function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await authApi.changePassword();
      setSent(true);
      toast.success('Enlace de verificacion enviado');
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cambiar Contrasena</h1>
          <p className="text-gray-500">Para cambiar tu contrasena es necesario verificar tu identidad por correo.</p>
        </div>

        <Card>
          {sent ? (
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <MailCheck size={40} className="mx-auto mb-3 text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">Revisa tu correo</h2>
              <p className="mt-2 text-sm text-green-700">
                Hemos enviado un enlace de verificacion a <strong>{user?.email}</strong>. Apreta el enlace y
                podras establecer tu nueva contrasena.
              </p>
              <p className="mt-2 text-xs text-green-600">El enlace expira en 1 hora.</p>
              <Button variant="outline" className="mt-5" onClick={() => navigate('/dashboard')}>
                Volver al panel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Lock size={20} className="mt-0.5 shrink-0 text-upam-primary" />
                <div className="text-sm text-gray-600">
                  <p>
                    Se enviara un <strong>enlace de verificacion</strong> a tu correo <strong>{user?.email}</strong>.
                  </p>
                  <p className="mt-1">
                    Solo despues de confirmar tu correo podras elegir una nueva contrasena, tal como se hace al
                    recuperar una contrasena olvidada.
                  </p>
                </div>
              </div>
              <Button type="button" onClick={handleSend} loading={loading} className="w-full">
                Enviar enlace de verificacion
              </Button>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-sm text-upam-secondary hover:text-upam-primary"
                >
                  Cancelar y volver
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
