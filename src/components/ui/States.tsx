import { CircleAlert, Loader2, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "./Button";

export function Spinner({ label = "Chargement" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> <span className="text-sm">{label}</span>
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md py-14 text-center">
      <CircleAlert className="mx-auto mb-3 h-8 w-8 text-danger" aria-hidden />
      <p className="mb-4 text-sm text-ink">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Réessayer</Button>}
    </div>
  );
}
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-14 text-center">
      <PackageOpen className="mx-auto mb-3 h-8 w-8 text-champagne" aria-hidden />
      <h3 className="mb-1 text-xl">{title}</h3>
      {text && <p className="mb-4 text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}
