import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface Common { label: string; error?: string; hint?: string }

function Wrap({ id, label, error, hint, children }: Common & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TextField({ label, error, hint, ...p }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <input id={id} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...p} />
    </Wrap>
  );
}
export function TextArea({ label, error, hint, ...p }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <textarea id={id} rows={4} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...p} />
    </Wrap>
  );
}
export function SelectField({ label, error, hint, children, ...p }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <select id={id} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...p}>{children}</select>
    </Wrap>
  );
}
export function CheckField({ label, ...p }: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input id={id} type="checkbox" className="mt-1 h-4 w-4 accent-plum" {...p} />
      <label htmlFor={id} className="text-sm text-ink">{label}</label>
    </div>
  );
}
