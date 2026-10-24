import { formatPrice } from "./format";

export interface WaLine {
  name: string;
  variant?: string;
  /** Univers du produit : "Khaliqa Beauty", "Khaliqa Hair", etc. */
  universe?: string;
  quantity: number;
  unitPrice: number;
  url?: string;
}

/**
 * Construit le message WhatsApp structuré.
 * Chaque ligne inclut l'univers si fourni pour que la boutique sache
 * de quelle gamme vient le produit.
 */
export function buildWhatsAppMessage(opts: {
  storeName: string;
  lines: WaLine[];
  reference?: string;
}): string {
  const parts = [`Bonjour ${opts.storeName}, je souhaite commander :`, ""];
  let subtotal = 0;

  for (const l of opts.lines) {
    subtotal += l.unitPrice * l.quantity;
    const v = l.variant ? ` (${l.variant})` : "";
    const u = l.universe ? ` [${l.universe}]` : "";
    parts.push(`- ${l.name}${v}${u} x${l.quantity} : ${formatPrice(l.unitPrice * l.quantity)}`);
    if (l.url) parts.push(`  ${l.url}`);
  }

  parts.push("", `Sous-total : ${formatPrice(subtotal)} (hors livraison)`);
  if (opts.reference) parts.push(`Référence de ma commande sur le site : ${opts.reference}`);
  return parts.join("\n");
}

/**
 * Numéro WhatsApp officiel Mamy Khaliqa — fallback si l'admin n'a pas
 * encore configuré le numéro dans les paramètres de la boutique.
 */
const OFFICIAL_WA_NUMBER = "221710497804";

/**
 * Construit l'URL wa.me avec le message encodé.
 * Priorité : numéro configuré par l'admin → numéro officiel.
 * Ne retourne jamais null (le bouton est toujours cliquable).
 */
export function whatsappUrl(number: string | undefined, message: string): string {
  const digits = (number ?? "").replace(/\D/g, "");
  const resolved = digits || OFFICIAL_WA_NUMBER;
  return `https://wa.me/${resolved}?text=${encodeURIComponent(message)}`;
}
