import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, count, pageSize, onChange }: {
  page: number; count: number; pageSize: number; onChange: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1) return null;

  /* Pages visibles : toujours 1, last, et les 2 voisines de la page courante */
  const visible = new Set<number>();
  visible.add(1); visible.add(pages);
  for (let i = Math.max(1, page - 1); i <= Math.min(pages, page + 1); i++) visible.add(i);
  const sorted = [...visible].sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      {/* Précédent */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-plum hover:text-plum disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {/* Numéros */}
      {sorted.map((p, i) => {
        const gap = i > 0 && p - sorted[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-sm text-muted">…</span>}
            <button
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition-colors ${
                p === page
                  ? "bg-plum text-ivory shadow-sm"
                  : "border border-line text-ink hover:border-plum hover:text-plum"
              }`}
            >
              {p}
            </button>
          </span>
        );
      })}

      {/* Suivant */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-plum hover:text-plum disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
