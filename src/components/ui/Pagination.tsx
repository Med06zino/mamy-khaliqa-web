import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, count, pageSize, onChange }: { page: number; count: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
      <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
      <span className="text-sm text-muted">Page {page} sur {pages}</span>
      <button className="btn btn-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" aria-hidden /></button>
    </nav>
  );
}
