import { MessageCircle } from "lucide-react";

import { buildWhatsAppMessage, whatsappUrl, type WaLine } from "../lib/whatsapp";
import { useSettings } from "../store/settings";

/**
 * Ouvre WhatsApp avec un message prérempli.
 *
 * Utilise le numéro configuré par l'admin si disponible, sinon le numéro
 * officiel Mamy Khaliqa (221710497804). Le bouton est donc toujours actif.
 *
 * Le client voit et peut modifier le message avant de l'envoyer.
 * Aucune commande n'est enregistrée automatiquement via ce bouton.
 */
export function WhatsAppButton({
  lines,
  reference,
  label = "Commander via WhatsApp",
  className = "btn btn-secondary",
  disabled,
}: {
  lines: WaLine[];
  reference?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { settings } = useSettings();
  const url = whatsappUrl(
    settings.whatsapp_number,
    buildWhatsAppMessage({ storeName: settings.name, lines, reference }),
  );

  return (
    <a
      href={disabled ? undefined : url}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      className={`${className} ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      {label}
    </a>
  );
}
