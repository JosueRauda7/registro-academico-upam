import { ReactNode, RefObject, useLayoutEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  initialFocusRef?: RefObject<HTMLElement>;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', initialFocusRef }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element) return;
    element.showModal();
    initialFocusRef?.current?.focus();
    return () => { if (element.open) element.close(); };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-modal="true"
      className={`m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] ${sizes[size]} overflow-y-auto rounded-xl border-0 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar diálogo" className="rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-upam-primary">
          <X size={20} />
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
