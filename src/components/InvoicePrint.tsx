import { Download, Printer } from "lucide-react";
import { useRef } from "react";

import { formatPrice } from "../lib/format";
import { useSettings } from "../store/settings";
import type { Order } from "../types";

/* ─── Types ─────────────────────────────────────────────────────── */
interface Props {
  order: Order;
  /** Variante visuelle : "client" (bouton sobre) | "admin" (bouton dark) */
  variant?: "client" | "admin";
  label?: string;
  className?: string;
}

/* ─── Composant principal ────────────────────────────────────────── */
/**
 * Facture professionnelle Mamy Khaliqa — imprimable ou exportable en PDF.
 *
 * Utilisée à deux endroits :
 *   - /compte/commandes/:number  → côté client  (variant="client")
 *   - Modal admin OrderModal     → côté admin   (variant="admin")
 *
 * Mécanisme : le HTML de la facture est injecté dans le DOM dans un
 * wrapper caché, puis window.print() l'affiche seul via @media print.
 * Compatible "Enregistrer en PDF" depuis la boîte d'impression du navigateur.
 */
export function InvoicePrint({ order: o, variant = "client", label, className }: Props) {
  const { settings } = useSettings();
  const printId      = `mk-invoice-${o.number}`;
  const styleRef     = useRef<HTMLStyleElement | null>(null);

  const handlePrint = () => {
    const css = `
      @media print {
        @page { size: A4; margin: 18mm 16mm; }
        body > *:not(#${printId}-wrapper) { display: none !important; }
        #${printId}-wrapper {
          display: block !important;
          position: fixed; inset: 0;
          background: white;
          z-index: 99999;
        }
      }
    `;
    const style       = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    styleRef.current  = style;
    window.print();
    const cleanup = () => {
      style.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
  };

  /* Style du bouton selon la variante */
  const btnCls = className ?? (
    variant === "admin"
      ? "flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
      : "flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-plum/40 hover:bg-blush hover:text-plum"
  );

  const Icon = variant === "admin" ? Download : Printer;

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        className={btnCls}
        aria-label="Imprimer ou télécharger la facture en PDF"
      >
        <Icon className="h-4 w-4" aria-hidden />
        {label ?? (variant === "admin" ? "Télécharger la facture" : "Imprimer / Télécharger la facture")}
      </button>

      {/* HTML injecté — caché à l'écran, rendu uniquement à l'impression */}
      <div
        id={`${printId}-wrapper`}
        style={{ display: "none" }}
        dangerouslySetInnerHTML={{ __html: buildInvoiceHtml(o, settings) }}
        aria-hidden="true"
      />
    </>
  );
}

/* ─── Génération HTML ────────────────────────────────────────────── */

/** Palette de couleurs de la marque */
const C = {
  plum:      "#713F52",
  plumDark:  "#5A3242",
  champagne: "#C6A36A",
  ink:       "#1A1118",
  muted:     "#7A6E77",
  line:      "#EAE0E4",
  blush:     "#F7E8E8",
  ivory:     "#FFFDF9",
  success:   "#2F6B4F",
  danger:    "#9B2C2C",
  white:     "#FFFFFF",
};

function buildInvoiceHtml(
  o: Order,
  settings: {
    name: string; tagline: string; logo: string | null;
    address: string; contact_email: string; contact_phone: string;
  },
): string {
  /* ── Dates ── */
  const dateCreated = new Date(o.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const dateGenerated = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  /* ── Couleurs badge paiement ── */
  const psBg    = o.payment_status === "paid"     ? "#2F6B4F18"
                : o.payment_status === "refunded" ? "#C6A36A18"
                : "#9B2C2C18";
  const psColor = o.payment_status === "paid"     ? C.success
                : o.payment_status === "refunded" ? "#8B6330"
                : C.danger;

  /* ── Lignes du tableau ── */
  const rows = o.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? C.ivory : C.white};">
      <td style="padding:11px 14px;border-bottom:1px solid ${C.line};">
        <span style="font-weight:600;font-size:13px;color:${C.ink};">${esc(item.product_name)}</span>
        ${item.variant_name
          ? `<br><span style="font-size:11px;color:${C.muted};margin-top:2px;display:inline-block;">
              Variante : ${esc(item.variant_name)}</span>`
          : ""}
      </td>
      <td style="padding:11px 14px;border-bottom:1px solid ${C.line};font-size:11px;color:${C.muted};white-space:nowrap;">${esc(item.product_sku)}</td>
      <td style="padding:11px 14px;border-bottom:1px solid ${C.line};text-align:center;font-weight:700;color:${C.ink};">${item.quantity}</td>
      <td style="padding:11px 14px;border-bottom:1px solid ${C.line};text-align:right;color:${C.muted};font-size:13px;">${formatPrice(item.unit_price)}</td>
      <td style="padding:11px 14px;border-bottom:1px solid ${C.line};text-align:right;font-weight:700;color:${C.plum};font-size:14px;">${formatPrice(item.line_total)}</td>
    </tr>
  `).join("");

  /* ── Logo : texte stylisé si pas d'image ── */
  const logoBlock = settings.logo
    ? `<img src="${settings.logo}" alt="${esc(settings.name)}" style="height:48px;width:auto;object-fit:contain;">`
    : `<div style="display:inline-flex;align-items:center;justify-content:center;
          width:52px;height:52px;border-radius:12px;
          background:${C.plum};color:white;
          font-size:18px;font-weight:800;letter-spacing:-1px;">
          ${esc(settings.name.charAt(0))}K
        </div>`;

  /* ── Corps complet de la facture ── */
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${C.ink}; background: white; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div style="max-width:780px;margin:0 auto;padding:36px 40px;background:white;">

  <!-- ═══ EN-TÊTE ═══ -->
  <table style="width:100%;margin-bottom:0;">
    <tr>
      <!-- Logo + Nom boutique -->
      <td style="vertical-align:top;width:55%;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${logoBlock}
          <div>
            <h1 style="font-size:22px;font-weight:800;color:${C.plum};letter-spacing:-0.5px;line-height:1.1;">
              ${esc(settings.name)}
            </h1>
            ${settings.tagline
              ? `<p style="font-size:11px;color:${C.muted};margin-top:3px;font-style:italic;">${esc(settings.tagline)}</p>`
              : ""}
          </div>
        </div>
        <div style="margin-top:12px;font-size:11.5px;color:${C.muted};line-height:1.8;">
          ${settings.address     ? `<span>📍 ${esc(settings.address)}</span><br>` : ""}
          ${settings.contact_email ? `<span>✉ ${esc(settings.contact_email)}</span><br>` : ""}
          ${settings.contact_phone ? `<span>📞 ${esc(settings.contact_phone)}</span>` : ""}
        </div>
      </td>

      <!-- Bloc numéro de facture -->
      <td style="text-align:right;vertical-align:top;">
        <div style="display:inline-block;text-align:right;">
          <div style="background:${C.plum};color:white;border-radius:10px;padding:14px 20px;display:inline-block;">
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.7;margin-bottom:4px;">Facture</p>
            <p style="font-size:18px;font-weight:800;letter-spacing:-0.5px;">${esc(o.number)}</p>
          </div>
          <div style="margin-top:10px;font-size:12px;color:${C.muted};line-height:1.7;">
            <p>Émise le <strong style="color:${C.ink};">${dateCreated}</strong></p>
            <p>Générée le <strong style="color:${C.ink};">${dateGenerated}</strong></p>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Filet dégradé -->
  <div style="height:3px;background:linear-gradient(90deg,${C.plum} 0%,${C.champagne} 60%,transparent 100%);
              border-radius:2px;margin:24px 0 28px;"></div>

  <!-- ═══ INFORMATIONS CLIENT & LIVRAISON ═══ -->
  <table style="width:100%;margin-bottom:28px;border-collapse:collapse;">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:24px;">
        <div style="background:${C.blush};border-radius:12px;padding:16px 18px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:${C.plum};
                    font-weight:700;margin-bottom:10px;">Client</p>
          <p style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:4px;">
            ${esc(o.first_name)} ${esc(o.last_name)}
          </p>
          <p style="font-size:12.5px;color:${C.muted};line-height:1.7;">
            ${esc(o.phone)}<br>
            ${o.email ? esc(o.email) : ""}
          </p>
        </div>
      </td>
      <td style="width:50%;vertical-align:top;">
        <div style="background:${C.blush};border-radius:12px;padding:16px 18px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:${C.plum};
                    font-weight:700;margin-bottom:10px;">Adresse de livraison</p>
          <p style="font-size:12.5px;color:${C.ink};line-height:1.7;">
            ${esc(o.address_line)}<br>
            ${esc(o.city)}<br>
            ${o.delivery_zone_name
              ? `<span style="color:${C.muted};">Zone : ${esc(o.delivery_zone_name)}</span>`
              : ""}
          </p>
        </div>
      </td>
    </tr>
  </table>

  <!-- ═══ TABLEAU ARTICLES ═══ -->
  <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;
                box-shadow:0 1px 6px rgba(113,63,82,0.08);margin-bottom:24px;">
    <thead>
      <tr style="background:${C.plum};">
        <th style="padding:12px 14px;text-align:left;color:white;font-size:11px;
                   text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Produit</th>
        <th style="padding:12px 14px;text-align:left;color:white;font-size:11px;
                   text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Référence</th>
        <th style="padding:12px 14px;text-align:center;color:white;font-size:11px;
                   text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Qté</th>
        <th style="padding:12px 14px;text-align:right;color:white;font-size:11px;
                   text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Prix unit.</th>
        <th style="padding:12px 14px;text-align:right;color:white;font-size:11px;
                   text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- ═══ TOTAUX ═══ -->
  <table style="width:100%;margin-bottom:24px;">
    <tr>
      <td style="width:55%;"></td>
      <td style="width:45%;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:7px 0;font-size:13px;color:${C.muted};">Sous-total</td>
            <td style="padding:7px 0;font-size:13px;text-align:right;font-weight:600;color:${C.ink};">
              ${formatPrice(o.subtotal)}
            </td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:${C.muted};">
              Livraison${o.delivery_zone_name ? ` (${esc(o.delivery_zone_name)})` : ""}
            </td>
            <td style="padding:7px 0;font-size:13px;text-align:right;font-weight:600;color:${C.ink};">
              ${o.delivery_fee_pending ? `<em style="color:${C.muted};">À confirmer</em>` : formatPrice(o.delivery_fee)}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:6px 0;">
              <div style="height:2px;background:${C.line};border-radius:2px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;font-size:16px;font-weight:800;color:${C.ink};">Total TTC</td>
            <td style="padding:10px 0 0;font-size:20px;font-weight:800;color:${C.plum};text-align:right;">
              ${formatPrice(o.total)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- ═══ PAIEMENT ═══ -->
  <table style="width:100%;margin-bottom:32px;border-collapse:collapse;">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:12px;">
        <div style="border:1px solid ${C.line};border-radius:12px;padding:14px 16px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;
                    color:${C.plum};font-weight:700;margin-bottom:8px;">Mode de règlement</p>
          <p style="font-size:13px;font-weight:600;color:${C.ink};">
            ${esc(o.payment_method_label ?? "Non précisée")}
          </p>
        </div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:12px;">
        <div style="border:1px solid ${C.line};border-radius:12px;padding:14px 16px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;
                    color:${C.plum};font-weight:700;margin-bottom:8px;">Statut du paiement</p>
          <span style="display:inline-flex;align-items:center;gap:6px;
                       padding:5px 14px;border-radius:20px;
                       background:${psBg};color:${psColor};
                       font-size:12px;font-weight:700;">
            ${o.payment_status === "paid" ? "✓" : o.payment_status === "refunded" ? "↩" : "○"}
            ${esc(o.payment_status_label)}
          </span>
        </div>
      </td>
    </tr>
  </table>

  <!-- ═══ NOTE CLIENT ═══ -->
  ${o.customer_note ? `
    <div style="background:#FFFDF9;border:1px dashed ${C.champagne};border-radius:10px;
                padding:12px 16px;margin-bottom:28px;">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;
                color:${C.champagne};font-weight:700;margin-bottom:6px;">Note de commande</p>
      <p style="font-size:12.5px;color:${C.muted};line-height:1.6;">${esc(o.customer_note)}</p>
    </div>
  ` : ""}

  <!-- ═══ PIED DE PAGE ═══ -->
  <div style="border-top:2px solid ${C.line};padding-top:18px;
              display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
    <div>
      <p style="font-size:12px;font-weight:700;color:${C.plum};">${esc(settings.name)}</p>
      <p style="font-size:11px;color:${C.muted};margin-top:2px;">
        Merci pour votre confiance et votre fidélité.
      </p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10.5px;color:${C.muted};">Ce document tient lieu de facture.</p>
      <p style="font-size:10px;color:#c0b8bc;margin-top:2px;">
        Généré le ${dateGenerated}
      </p>
    </div>
  </div>

</div>
</body>
</html>`;
}

/** Échappe les caractères HTML pour éviter toute injection dans le innerHTML. */
function esc(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
