import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { legacySubjectsApi } from '@/api/legacySubjects.api';

export function LegacyImportCard({ onImported }: { onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [inputKey, setInputKey] = useState(0);

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await legacySubjectsApi.template();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'plantilla-notas-previas.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('No se pudo descargar la plantilla');
    } finally { setDownloading(false); }
  };

  const upload = async () => {
    if (!file) return;
    setImporting(true);
    setErrors([]);
    setResult('');
    try {
      const summary = await legacySubjectsApi.importFile(file);
      setResult(`Se guardaron ${summary.imported} notas de ${summary.students} estudiantes.`);
      setFile(null);
      setInputKey((n) => n + 1);
      onImported();
    } catch (error: any) {
      const message = error.response?.data?.message;
      setErrors(Array.isArray(message) ? message : [typeof message === 'string' ? message : 'No se pudo importar el archivo. Verifica tu conexión y vuelve a intentarlo.']);
    } finally { setImporting(false); }
  };

  return (
    <Card title="Importar notas desde Excel" subtitle="Migra las notas anteriores al sistema de uno o varios estudiantes.">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Descarga la plantilla y completa la hoja «Notas previas» con carnet, código de materia, nota y,
          si los tienes, año, semestre y observaciones. La plantilla incluye instrucciones y un catálogo de materias.
          No necesitas seleccionar un estudiante para importar.
        </p>
        <p className="text-sm text-gray-600">
          Solo .xlsx, hasta 2 MB y 500 notas por archivo. Usa valores de texto o números, sin fórmulas,
          macros, enlaces ni objetos. Si hay errores, no se guarda ninguna fila. Las notas existentes no se sobrescriben.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Button type="button" variant="outline" onClick={download} loading={downloading} disabled={importing}>
            <Download size={16} className="mr-2" /> Descargar plantilla
          </Button>
          <div className="min-w-0 flex-1">
            <label htmlFor="legacy-import-file" className="mb-1 block text-sm font-medium text-gray-700">Archivo Excel</label>
            <input key={inputKey} id="legacy-import-file" type="file" accept=".xlsx" disabled={importing}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setErrors([]); setResult('');
                if (selected && (!/\.xlsx$/i.test(selected.name) || selected.size > 2 * 1024 * 1024)) {
                  setFile(null); setErrors(['Selecciona un archivo .xlsx de máximo 2 MB.']);
                  event.target.value = '';
                } else setFile(selected);
              }} />
          </div>
          <Button type="button" onClick={upload} disabled={!file} loading={importing}>
            <Upload size={16} className="mr-2" /> Validar e importar
          </Button>
        </div>
        {result && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{result}</p>}
        {errors.length > 0 && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <p className="mb-2 font-semibold">No se completó la importación. Revisa los mensajes antes de reintentar.</p>
            <ul className="max-h-60 list-disc space-y-1 overflow-auto pl-5">
              {errors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
            {errors.length === 50 && <p className="mt-2">Se muestran hasta 50 errores por intento.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}
