import { Mail, MessageCircle, Phone } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "../components/ui/Button";
import { TextArea, TextField } from "../components/ui/Field";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { ApiError, errorMessage, post } from "../lib/api";
import { formatPrice } from "../lib/format";
import { toast } from "../store/toast";
import { useSettings } from "../store/settings";
import type { DeliveryZone } from "../types";

function Page({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(title);
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="mb-6 text-4xl">{title}</h1>
      <div className="prose-mk">{children}</div>
    </div>
  );
}

export function About() {
  const { settings } = useSettings();
  return (
    <Page title="À propos">
      <p>{settings.name} est une boutique de produits cosmétiques : huile pousse-cils, gamme capillaire et gloss.</p>
      <p>{settings.tagline}</p>
      <p>Pour toute question sur un produit, son utilisation ou une commande, écrivez-nous depuis la page Contact ou directement sur WhatsApp.</p>
    </Page>
  );
}

export function Delivery() {
  const { settings } = useSettings();
  const { data } = useApi<DeliveryZone[]>("/delivery-zones/");
  return (
    <Page title="Livraison">
      <p>Les frais de livraison dépendent de votre zone. Ils sont calculés automatiquement au moment de la commande.</p>
      {data && data.length > 0 && (
        <div className="card mb-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-blush"><tr><th className="p-3 font-medium">Zone</th><th className="p-3 font-medium">Frais</th><th className="p-3 font-medium">Informations</th></tr></thead>
            <tbody>{data.map((z) => <tr key={z.id} className="border-b border-line last:border-0"><td className="p-3 text-ink">{z.name}</td><td className="p-3 text-ink">{formatPrice(z.fee)}</td><td className="p-3">{z.info}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <p>{settings.unknown_zone_policy}</p>
    </Page>
  );
}

export function Returns() {
  return (
    <Page title="Retours et remboursements">
      <p>Les conditions de retour et de remboursement sont définies par la boutique. Si un produit présente un problème, contactez-nous en indiquant votre numéro de commande : nous étudierons votre demande.</p>
      <p>Pour des raisons d'hygiène, certains produits cosmétiques ouverts ne peuvent pas toujours être repris. Les règles précises seront précisées ici par la boutique.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Conditions générales de vente">
      <p>Ces conditions décrivent le cadre des commandes passées sur ce site. Le texte définitif (prix, paiement, livraison, retours, litiges) doit être rédigé ou validé par la propriétaire de la boutique avant la mise en production.</p>
      <h2>Commandes</h2>
      <p>Une commande est enregistrée lorsque le site affiche sa référence. Elle est ensuite confirmée par la boutique. Les prix sont indiqués en FCFA et recalculés au moment de la validation.</p>
      <h2>Paiement</h2>
      <p>Les modes de règlement disponibles sont ceux affichés lors de la commande. Aucun paiement en ligne n'est actif pour le moment.</p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Politique de confidentialité">
      <p>Nous collectons uniquement les informations nécessaires au traitement de vos commandes et à la gestion de votre compte : nom, e-mail, téléphone et adresse de livraison.</p>
      <p>Ces données ne sont pas vendues. Le texte définitif de cette politique doit être validé par la propriétaire de la boutique avant la mise en production.</p>
    </Page>
  );
}

export function Faq() {
  const items: [string, string][] = [
    ["Comment passer commande ?", "Ajoutez vos produits au panier puis validez la commande sur le site, ou écrivez-nous sur WhatsApp."],
    ["Dois-je créer un compte ?", "Un compte vous permet de suivre vos commandes et d'enregistrer vos adresses. La commande sans compte est possible si la boutique l'a activée."],
    ["Comment connaître les frais de livraison ?", "Ils s'affichent selon votre zone au moment de la commande. Si votre zone n'est pas listée, la boutique vous confirme les frais avant l'expédition."],
    ["Comment payer ?", "Les modes de règlement disponibles sont indiqués lors de la commande. Le paiement en ligne n'est pas encore proposé."],
    ["Comment suivre ma commande ?", "Connectez-vous à votre compte, rubrique Mes commandes, pour consulter son statut."],
  ];
  return (
    <Page title="Questions fréquentes">
      <div className="divide-y divide-line border-y border-line">
        {items.map(([q, a]) => (
          <details key={q} className="py-4"><summary className="cursor-pointer font-medium text-ink">{q}</summary><p className="mt-2 !mb-0">{a}</p></details>
        ))}
      </div>
    </Page>
  );
}

export function Contact() {
  useDocumentTitle("Contact");
  const { settings } = useSettings();
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errs, setErrs] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErrs(null);
    try { await post("/contact/", f); toast.success("Message envoyé. Nous vous répondrons rapidement."); setF({ name: "", email: "", phone: "", subject: "", message: "" }); }
    catch (er) { if (er instanceof ApiError) setErrs(er); toast.error(errorMessage(er)); }
    finally { setBusy(false); }
  };
  return (
    <div className="container-page grid gap-10 py-12 md:grid-cols-2">
      <div>
        <h1 className="mb-4 text-4xl">Contact</h1>
        <p className="mb-6 text-muted">Une question sur un produit ou une commande ? Écrivez-nous.</p>
        <ul className="mb-6 space-y-3 text-sm">
          {settings.contact_email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-plum" aria-hidden />{settings.contact_email}</li>}
          {settings.contact_phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-plum" aria-hidden />{settings.contact_phone}</li>}
        </ul>
        <WhatsAppButton lines={[]} label="Écrire sur WhatsApp" className="btn btn-primary" />
        <p className="mt-2 flex items-center gap-1 text-xs text-muted"><MessageCircle className="h-3.5 w-3.5" aria-hidden />Une conversation WhatsApp s'ouvre dans une nouvelle fenêtre.</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
        <TextField label="Nom" required value={f.name} onChange={set("name")} error={errs?.field("name")} />
        <TextField label="E-mail" type="email" required value={f.email} onChange={set("email")} error={errs?.field("email")} />
        <TextField label="Téléphone (facultatif)" type="tel" value={f.phone} onChange={set("phone")} error={errs?.field("phone")} />
        <TextField label="Sujet" required value={f.subject} onChange={set("subject")} error={errs?.field("subject")} />
        <TextArea label="Message" required value={f.message} onChange={set("message")} error={errs?.field("message")} />
        <Button type="submit" disabled={busy}>{busy ? "Envoi en cours" : "Envoyer le message"}</Button>
      </form>
    </div>
  );
}
