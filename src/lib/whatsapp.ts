import { formatPrice } from "./format";

export interface WaLine { name: string; variant?: string; quantity: number; unitPrice: number; url?: string }

export function buildWhatsAppMessage(opts: { storeName: string; lines: WaLine[]; reference?: string }): string {
  const parts = [`Bonjour ${opts.storeName}, je souhaite commander :`, ""];
  let subtotal = 0;
  for (const l of opts.lines) {
    subtotal += l.unitPrice * l.quantity;
    const v = l.variant ? ` (${l.variant})` : "";
    parts.push(`- ${l.name}${v} x${l.quantity} : ${formatPrice(l.unitPrice * l.quantity)}`);
    if (l.url) parts.push(`  ${l.url}`);
  }
  parts.push("", `Sous-total : ${formatPrice(subtotal)} (hors livraison)`);
  if (opts.reference) parts.push(`Reference de ma commande sur le site : ${opts.reference}`);
  return parts.join("\n");
}

/** Numero au format international, chiffres uniquement. Retourne null si non configure. */
export function whatsappUrl(number: string | undefined, message: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
