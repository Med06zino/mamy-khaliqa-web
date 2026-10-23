import { stockLabel } from "../../lib/format";
import type { StockStatus } from "../../types";

const TONE: Record<StockStatus, string> = {
  in_stock: "text-success", low_stock: "text-champagne", out_of_stock: "text-danger",
};
export function StockBadge({ status }: { status: StockStatus }) {
  return <span className={`text-xs font-medium ${TONE[status]}`}>{stockLabel(status)}</span>;
}
