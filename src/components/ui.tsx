import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function PageHeader({
  title,
  left,
  children,
}: {
  title: ReactNode;
  left?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pt-safe flex flex-shrink-0 items-center gap-1 border-b-2 border-ink/80 bg-paper px-2 pb-1">
      {left}
      <h1 className="min-w-0 flex-1 truncate px-2 font-serif text-xl font-bold">{title}</h1>
      {children}
    </header>
  );
}

export function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg active:bg-ink/10 ${
        danger ? 'text-alert' : 'text-ink/70'
      }`}
    >
      {children}
    </button>
  );
}

/** Botón de acción principal (tinta azul) o secundario (contorno). */
export function Btn({
  children,
  onClick,
  variant = 'solid',
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'line';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
        variant === 'solid'
          ? 'bg-pen text-white'
          : 'border border-ink/40 bg-paper text-ink active:bg-ink/10'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Panel inferior tipo hoja que sube desde abajo. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl border-t-2 border-ink/80 bg-paper"
      >
        <div className="flex items-center border-b border-rule px-4">
          <h2 className="flex-1 font-serif text-lg font-bold">{title}</h2>
          <IconBtn label="Cerrar" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconBtn>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
