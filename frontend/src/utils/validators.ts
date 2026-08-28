import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
    reserved: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    completed: 'Completado',
    pending: 'Pendiente',
    cancelled: 'Cancelado',
    failed: 'Fallido',
    refunded: 'Reembolsado',
    reserved: 'Reservado',
    confirmed: 'Confirmado',
    tuition: 'Matricula',
    monthly: 'Mensualidad',
  };
  return labels[status] || status;
}
