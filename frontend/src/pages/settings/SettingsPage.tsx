import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { settingsApi } from '@/api/settings.api';
import { useSettings } from '@/context/SettingsContext';
import toast from 'react-hot-toast';
import { ImageIcon, Palette, Save } from 'lucide-react';

export function SettingsPage() {
  const { refresh } = useSettings();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#1B4F72');
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getAdmin();
      setLogoUrl(data.logoUrl || null);
      setPrimaryColor(data.primaryColor || '#1B4F72');
      setInstitutionName(data.institutionName || '');
    } catch {
      toast.error('Error al cargar la configuracion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFile = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update({
        logoUrl,
        primaryColor,
        institutionName,
      });
      await refresh();
      toast.success('Configuracion del sistema actualizada');
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Error al guardar configuracion');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Configuracion del Sistema</h1>
          <p className="text-gray-500">Personalice el logo institucional y el color principal</p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Logo */}
            <Card title="Logo institucional">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon size={28} />
                      <span className="mt-1 text-xs">Sin logo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="mb-2 text-sm text-gray-500">
                    Suba una imagen (JPG, PNG o SVG) de maximo 2MB. Se muestra en el lado izquierdo del sistema.
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-upam-primary px-4 py-2 text-sm font-medium text-upam-primary hover:bg-upam-primary hover:text-white">
                    <ImageIcon size={16} />
                    Seleccionar imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoFile(e.target.files?.[0]!)}
                    />
                  </label>
                  {logoUrl && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Quitar logo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Nombre de la institucion">
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Universidad Panamericana de El Salvador"
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Color principal">
              <div className="flex items-center gap-4">
                <label
                  className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-4 border-gray-200"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Palette className="text-white" size={22} />
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
                <div className="flex-1">
                  <Input
                    label="Valor hexadecimal"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    pattern="^#([0-9a-fA-F]{6})$"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Se aplica en tiempo real a la barra lateral, botones y acentos.
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Vista previa">
              <div className="space-y-3">
                <div className="flex h-16 items-center rounded-xl px-4 text-white" style={{ backgroundColor: primaryColor }}>
                  <span className="text-lg font-semibold">{institutionName || 'Institucion'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg px-4 py-2 text-sm text-white" style={{ backgroundColor: primaryColor }}>
                    {institutionName || 'Institucion'}
                  </span>
                  <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-upam-primary" style={{ borderColor: primaryColor, color: primaryColor }}>
                    Visita nuestra web
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end lg:col-span-2">
            <Button type="submit" loading={saving}>
              <Save size={16} className="mr-2" /> Guardar Configuracion
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}