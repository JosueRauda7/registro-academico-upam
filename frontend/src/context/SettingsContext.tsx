import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { settingsApi } from '@/api/settings.api';

interface Branding {
  logoUrl: string | null;
  primaryColor: string;
  institutionName: string;
}

interface SettingsContextType extends Branding {
  branding: Branding;
  refresh: () => Promise<void>;
}

const DEFAULT_BRANDING: Branding = {
  logoUrl: null,
  primaryColor: '#1B4F72',
  institutionName: 'Universidad Panamericana de El Salvador',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return DEFAULT_BRANDING.primaryColor;
  }
  return `${r} ${g} ${b}`;
}

export function lightenHex(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const nums = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  const factor = 1 + percent / 100;
  const mixed = nums
    .map((n) => Math.min(255, Math.round(n * factor)))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
  return `#${mixed}`;
}

function applyBranding(branding: Branding) {
  const root = document.documentElement;
  root.style.setProperty('--upam-primary', hexToRgbString(branding.primaryColor));
  root.style.setProperty('--upam-secondary', hexToRgbString(lightenHex(branding.primaryColor, 18)));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(() => {
    try {
      const saved = localStorage.getItem('upam_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        applyBranding({ ...DEFAULT_BRANDING, ...parsed });
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch {
      // ignore corrupt cache
    }
    return DEFAULT_BRANDING;
  });

  const refresh = useCallback(async () => {
    try {
      const data = await settingsApi.getPublic();
      const next = {
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || DEFAULT_BRANDING.primaryColor,
        institutionName: data.institutionName || DEFAULT_BRANDING.institutionName,
      };
      setBranding(next);
      applyBranding(next);
      localStorage.setItem('upam_settings', JSON.stringify(next));
    } catch {
      applyBranding(branding);
    }
  }, [branding]);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ ...branding, branding, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}