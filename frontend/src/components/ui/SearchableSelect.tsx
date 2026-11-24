import { Children, isValidElement, ReactNode, SelectHTMLAttributes, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { matchesLabel } from './select-options';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> { searchLabel?: string; }
interface Option { value: string; label: string; disabled: boolean; }
function textOf(value: ReactNode): string {
  return Children.toArray(value).map(child => isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : String(child)).join('');
}
function readOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean; label?: string }>(child)) return [];
    if (child.type === 'option') return [{ value: String(child.props.value ?? textOf(child.props.children)), label: child.props.label ?? textOf(child.props.children), disabled: !!child.props.disabled }];
    return readOptions(child.props.children);
  });
}

export function SearchableSelect({ children, value, defaultValue, onChange, disabled, multiple, required, className, id, searchLabel, ...props }: Props) {
  const generated = useId();
  const inputId = id ?? generated;
  const listId = `${inputId}-list`;
  const root = useRef<HTMLDivElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const options = readOptions(children);
  const current = value ?? defaultValue ?? (multiple ? [] : '');
  const selected = new Set((Array.isArray(current) ? current : [current]).map(String));
  const chosen = options.filter(option => selected.has(option.value) && option.value !== '');
  const placeholder = options.find(option => option.value === '')?.label ?? 'Selecciona una opción';
  const filtered = options.filter(option => matchesLabel(option.label, query));
  const activeOption = filtered[active];

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => { setInvalid(false); }, [value]);
  useEffect(() => { if (disabled) { setOpen(false); setQuery(''); } }, [disabled]);

  const choose = (option: Option) => {
    if (option.disabled || disabled || !native.current) return;
    if (multiple) {
      const next = new Set(selected);
      if (next.has(option.value)) next.delete(option.value); else next.add(option.value);
      for (const item of Array.from(native.current.options)) item.selected = next.has(item.value);
    } else native.current.value = option.value;
    native.current.dispatchEvent(new Event('change', { bubbles: true }));
    setInvalid(false); setQuery('');
    if (!multiple) setOpen(false);
    input.current?.focus();
  };

  return (
    <div ref={root} className="relative min-w-0" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) { setOpen(false); setQuery(''); }
    }}>
      <select {...props} ref={native} id={`${inputId}-native`} value={value} defaultValue={defaultValue}
        disabled={disabled} multiple={multiple} required={required} tabIndex={-1} aria-hidden="true" className="sr-only"
        onChange={onChange} onInvalid={event => { event.preventDefault(); setInvalid(true); setOpen(true); input.current?.focus(); }}>
        {!multiple && !options.some(option => option.value === '') && <option value="" disabled={required} hidden>{placeholder}</option>}
        {children}
      </select>
      <div className="relative">
        <input ref={input} id={inputId} type="text" role="combobox" autoComplete="off" disabled={disabled}
          aria-label={searchLabel ?? props['aria-label'] ?? (multiple ? 'Buscar y seleccionar opciones' : 'Buscar y seleccionar opción')}
          aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-required={required} aria-invalid={invalid || undefined}
          aria-activedescendant={open && activeOption ? `${listId}-${active}` : undefined}
          className={`${className ?? 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm'} w-full pr-9 disabled:bg-gray-50`}
          placeholder={multiple && chosen.length ? 'Buscar otra opción…' : placeholder}
          value={open ? query : multiple ? '' : chosen[0]?.label ?? ''}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setQuery(''); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault(); setOpen(true);
              setActive(n => !open ? event.key === 'ArrowDown' ? 0 : Math.max(0, filtered.length - 1) : Math.max(0, Math.min(filtered.length - 1, n + (event.key === 'ArrowDown' ? 1 : -1))));
            }
            if (event.key === 'Enter' && open) { event.preventDefault(); if (activeOption) choose(activeOption); }
            if (event.key === 'Tab') { setOpen(false); setQuery(''); }
          }} />
        <button type="button" disabled={disabled} aria-label={open ? 'Cerrar opciones' : 'Abrir opciones'} tabIndex={-1}
          className="absolute inset-y-0 right-0 px-2 text-gray-500" onMouseDown={e => e.preventDefault()}
          onClick={() => { if (open) { setOpen(false); setQuery(''); } else input.current?.focus(); }}><ChevronDown size={16} /></button>
      </div>
      {multiple && chosen.length > 0 && <div className="mt-2 flex flex-wrap gap-1" aria-label="Opciones seleccionadas">
        {chosen.map(option => <span key={option.value} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs text-upam-primary">
          <span className="break-words">{option.label}</span>
          <button type="button" disabled={disabled} aria-label={`Quitar ${option.label}`} onClick={() => choose(option)} className="rounded p-0.5 hover:bg-blue-100"><X size={14} /></button>
        </span>)}
      </div>}
      {open && <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
        <ul id={listId} role="listbox" aria-label="Opciones disponibles" aria-multiselectable={multiple || undefined}>
          {filtered.map((option, index) => <li key={option.value}>
            <button id={`${listId}-${index}`} type="button" role="option" aria-selected={selected.has(option.value)} aria-disabled={option.disabled || undefined}
              tabIndex={-1} disabled={option.disabled} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)}
              onClick={() => choose(option)} className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm disabled:opacity-50 ${active === index ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
              <span className="break-words">{option.label}</span>{selected.has(option.value) && <Check size={16} className="shrink-0 text-upam-primary" />}
            </button>
          </li>)}
        </ul>
        {!filtered.length && <p role="status" className="px-3 py-2 text-sm text-gray-500">Sin coincidencias</p>}
      </div>}
      {invalid && <p role="alert" className="mt-1 text-xs text-red-600">Selecciona una opción de la lista.</p>}
    </div>
  );
}
