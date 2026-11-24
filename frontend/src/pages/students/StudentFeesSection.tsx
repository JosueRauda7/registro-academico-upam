import { useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { studentsApi } from '@/api/students.api';
import { Student, UserRole } from '@/types';
import toast from 'react-hot-toast';

type Fees = { tuitionAmount: number | null; monthlyAmount: number | null };
export function StudentFeesSection({ student, onSaved }: { student: Student; onSaved: (fees: Fees) => void }) {
  const { hasRole } = useAuth();
  const [tuition, setTuition] = useState('');
  const [monthly, setMonthly] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setTuition(student.tuitionAmount == null ? '' : String(student.tuitionAmount));
    setMonthly(student.monthlyAmount == null ? '' : String(student.monthlyAmount));
  }, [student.id, student.tuitionAmount, student.monthlyAmount]);
  if (!hasRole(UserRole.ADMINISTRATOR, UserRole.ADMINISTRATIVE)) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const parse = (text: string) => text.trim() === '' ? null : Number(text);
    const fees = { tuitionAmount: parse(tuition), monthlyAmount: parse(monthly) };
    if (Object.values(fees).some(value => value !== null && (!Number.isFinite(value) || value < 0.01 || value > 99999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001))) {
      toast.error('Usa importes positivos con hasta dos decimales, o deja el campo vacío para usar el precio del ciclo.'); return;
    }
    setSaving(true);
    try {
      const saved = await studentsApi.updateFees(student.id, fees);
      onSaved({ tuitionAmount: saved.tuitionAmount, monthlyAmount: saved.monthlyAmount }); toast.success('Aranceles del estudiante guardados');
    } catch (error: any) {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || 'No se pudieron guardar los aranceles');
    } finally { setSaving(false); }
  };

  return (
    <section className="mt-6 border-t border-gray-200 pt-5" aria-labelledby="student-fees-title">
      <h3 id="student-fees-title" className="mb-2 flex items-center gap-2 font-semibold text-gray-900"><Banknote size={20} /> Aranceles del estudiante</h3>
      <p className="mb-4 text-sm text-gray-500">Define importes propios en USD. Deja un campo vacío para usar el precio del ciclo. Estos valores se aplican a nuevos cobros; los pagos ya registrados conservan su monto.</p>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="student-tuition-fee" label="Matrícula (USD)" type="number" min="0.01" max="99999999.99" step="0.01"
            value={tuition} onChange={event => setTuition(event.target.value)} placeholder="Usar precio del ciclo" disabled={saving} />
          <Input id="student-monthly-fee" label="Mensualidad (USD)" type="number" min="0.01" max="99999999.99" step="0.01"
            value={monthly} onChange={event => setMonthly(event.target.value)} placeholder="Usar precio del ciclo" disabled={saving} />
        </div>
        <div className="flex justify-end"><Button type="submit" loading={saving}>Guardar aranceles</Button></div>
      </form>
    </section>
  );
}
