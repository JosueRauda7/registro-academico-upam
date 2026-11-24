export interface DialogOptions {
  title?: string;
  confirmText?: string;
  danger?: boolean;
}

export interface DialogRequest extends DialogOptions {
  kind: 'confirm' | 'alert';
  message: string;
}

// Keep requests separate: two clicks must never resolve the wrong confirmation.
export function createDialogController(onChange: (request: DialogRequest | null) => void) {
  const pending: { request: DialogRequest; resolve: (accepted: boolean) => void }[] = [];
  const request = (kind: DialogRequest['kind'], message: string, options: DialogOptions = {}) =>
    new Promise<boolean>((resolve) => {
      pending.push({ request: { ...options, kind, message }, resolve });
      if (pending.length === 1) onChange(pending[0].request);
    });

  return {
    confirm: (message: string, options?: DialogOptions) => request('confirm', message, options),
    alert: async (message: string, options?: DialogOptions) => { await request('alert', message, options); },
    settle: (accepted: boolean) => {
      const current = pending.shift();
      if (!current) return;
      current.resolve(accepted);
      onChange(pending[0]?.request ?? null);
    },
    cancelAll: () => {
      const cancelled = pending.splice(0);
      onChange(null);
      cancelled.forEach((item) => item.resolve(false));
    },
  };
}
