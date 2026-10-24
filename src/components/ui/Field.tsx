import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface Common { label: string; error?: string; hint?: string }

function Wrap({ id, label, error, hint, children }: Common & { id: string; children: ReactNode }) {
  return (
    <div className="group">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, ...p }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className="input"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...p}
      />
    </Wrap>
  );
}

export function TextArea({ label, error, hint, ...p }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={4}
        className="input resize-none"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...p}
      />
    </Wrap>
  );
}

export function SelectField({ label, error, hint, children, ...p }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        className="input cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCA2TDggMTBMMTIgNiIgc3Ryb2tlPSIjNzQ2QjcyIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[right_0.75rem_center] bg-no-repeat pr-10"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...p}
      >
        {children}
      </select>
    </Wrap>
  );
}

export function CheckField({ label, ...p }: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded accent-plum cursor-pointer"
        {...p}
      />
      <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ink">
        {label}
      </label>
    </div>
  );
}
