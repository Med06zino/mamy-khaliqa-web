import { MessageCircle } from "lucide-react";

import { buildWhatsAppMessage, whatsappUrl, type WaLine } from "../lib/whatsapp";
import { useSettings } from "../store/settings";

/** Ouvre WhatsApp avec un message prerempli. Ne prouve pas l'envoi du message et n'enregistre aucune commande. */
export function WhatsAppButton({ lines, reference, label = "Commander via WhatsApp", className = "btn btn-secondary", disabled }:
  { lines: WaLine[]; reference?: string; label?: string; className?: string; disabled?: boolean }) {
  const { settings } = useSettings();
  const url = whatsappUrl(settings.whatsapp_number, buildWhatsAppMessage({ storeName: settings.name, lines, reference }));
  if (!url) {
    return <button type="button" className={className} disabled title="Le numéro WhatsApp n'est pas encore configuré."><MessageCircle className="h-4 w-4" aria-hidden />{label}</button>;
  }
  return (
    <a href={disabled ? undefined : url} target="_blank" rel="noopener noreferrer" aria-disabled={disabled} className={`${className} ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <MessageCircle className="h-4 w-4" aria-hidden />{label}
    </a>
  );
}
