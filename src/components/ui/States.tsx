import { AlertCircle, Loader2, PackageOpen, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "./Button";

/* ── Spinner ───────────────────────────────────────────────────── */
export function Spinner({ label = "Chargement" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
      <Loader2 className="h-8 w-8 animate-spin text-plum" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/* ── Skeleton générique ────────────────────────────────────────── */
export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-1/3 rounded-full" />
        <div className="skeleton h-5 w-4/5 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="skeleton h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/3 rounded-lg" />
            <div className="skeleton h-3 w-1/2 rounded-lg" />
          </div>
          <div className="skeleton h-4 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ── ErrorState ────────────────────────────────────────────────── */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/8">
        <AlertCircle className="h-7 w-7 text-danger" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-ink">Une erreur est survenue</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Réessayer
        </Button>
      )}
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────────── */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blush">
        <PackageOpen className="h-7 w-7 text-champagne" aria-hidden />
      </div>
      <div>
        <p className="font-display text-xl font-semibold text-ink">{title}</p>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
