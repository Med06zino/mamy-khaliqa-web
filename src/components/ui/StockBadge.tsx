import { CircleDot } from "lucide-react";

import { stockLabel } from "../../lib/format";
import type { StockStatus } from "../../types";

const TONE: Record<StockStatus, string> = {
  in_stock:     "text-success bg-success/8",
  low_stock:    "text-champagne bg-champagne/10",
  out_of_stock: "text-danger bg-danger/8",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[status]}`}>
      <CircleDot className="h-3 w-3" aria-hidden />
      {stockLabel(status)}
    </span>
  );
}
