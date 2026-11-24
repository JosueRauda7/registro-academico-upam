import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { createDialogController, DialogRequest } from '@/components/ui/dialog-controller';

const DialogContext = createContext<ReturnType<typeof createDialogController> | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [controller] = useState(() => createDialogController(setDialog));
  const cancelButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Leaving a screen must cancel its pending actions, including queued requests.
  useEffect(() => () => controller.cancelAll(), [controller, location.key]);
  useEffect(() => { if (dialog?.kind === 'confirm') cancelButton.current?.focus(); }, [dialog]);

  const confirmation = dialog?.kind === 'confirm';
  const danger = confirmation && dialog?.danger !== false;
  const Icon = danger ? AlertTriangle : Info;

  return (
    <DialogContext.Provider value={controller}>
      {children}
      <Modal isOpen={dialog !== null} onClose={() => controller.settle(false)}
        title={dialog?.title ?? (confirmation ? 'Confirmar acción' : 'Aviso')}
        size="sm" initialFocusRef={cancelButton}>
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-upam-primary'}`}>
            <Icon size={22} />
          </div>
          <p className="min-w-0 whitespace-pre-line break-words pt-1 text-sm text-gray-600">{dialog?.message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {confirmation && <button ref={cancelButton} type="button" onClick={() => controller.settle(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-upam-primary">Cancelar</button>}
          <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={() => controller.settle(true)}>
            {dialog?.confirmText ?? (confirmation ? 'Confirmar' : 'Aceptar')}
          </Button>
        </div>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog requiere DialogProvider');
  return context;
}
