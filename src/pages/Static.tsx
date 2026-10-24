import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "../components/ui/Button";
import { TextArea, TextField } from "../components/ui/Field";
import { ErrorState, Spinner } from "../components/ui/States";
import { WhatsAppButton } from "../components/WhatsAppButton";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { ApiError, errorMessage, post } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useSettings } from "../store/settings";
import { toast } from "../store/toast";
import type { DeliveryZone } from "../types";

/* ── Page wrapper ─────────────────────────────────────────────── */
function Page({ title, children }: { title: string; children: ReactNode }) {
  useDocumentTitle(title);
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight text-ink">{title}</h1>
      <div className="prose-mk">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────── */
export function Delivery() {
  const { settings } = useSettings();
  const { data, loading, error, reload } = useApi<DeliveryZone[]>("/delivery-zones/");

  return (
    <Page title="Livraison">
      <p>Les frais de livraison dépendent de votre zone. Ils sont calculés automatiquement au moment de la commande.</p>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data && data.length > 0 && (
        <div className="not-prose my-6 overflow-hidden rounded-2xl border border-line shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface">
              <tr>
                <th className="px-4 py-3 font-semibold text-ink">Zone</th>
                <th className="px-4 py-3 font-semibold text-ink">Frais</th>
                <th className="px-4 py-3 font-semibold text-ink">Informations</th>
              </tr>
            </thead>
            <tbody>
              {data.map((z) => (
                <tr key={z.id} className="border-b border-line last:border-0 transition-colors hover:bg-blush/40">
                  <td className="px-4 py-3 font-medium text-ink">{z.name}</td>
                  <td className="px-4 py-3 font-semibold text-plum">{formatPrice(z.fee)}</td>
                  <td className="px-4 py-3 text-muted">{z.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p>{settings.unknown_zone_policy}</p>
    </Page>
  );
}

/* ─────────────────────────────────────────────────────────────── */
export function Returns() {
  return (
    <Page title="Retours et remboursements">
      <p>Les conditions de retour et de remboursement sont définies par la boutique. Si un produit présente un problème, contactez-nous en indiquant votre numéro de commande : nous étudierons votre demande.</p>
      <p>Pour des raisons d'hygiène, certains produits cosmétiques ouverts ne peuvent pas toujours être repris. Les règles précises seront précisées ici par la boutique.</p>
    </Page>
  );
}

/* ─────────────────────────────────────────────────────────────── */
export function Terms() {
  return (
    <Page title="Conditions générales de vente">
      <p>Ces conditions décrivent le cadre des commandes passées sur ce site. Le texte définitif doit être rédigé ou validé par la propriétaire de la boutique avant la mise en production.</p>
      <h2>Commandes</h2>
      <p>Une commande est enregistrée lorsque le site affiche sa référence. Elle est ensuite confirmée par la boutique. Les prix sont indiqués en FCFA et recalculés au moment de la validation.</p>
      <h2>Paiement</h2>
      <p>Les modes de règlement disponibles sont ceux affichés lors de la commande. Aucun paiement en ligne n'est actif pour le moment.</p>
    </Page>
  );
}

/* ─────────────────────────────────────────────────────────────── */
export function Privacy() {
  return (
    <Page title="Politique de confidentialité">
      <p>Nous collectons uniquement les informations nécessaires au traitement de vos commandes et à la gestion de votre compte : nom, e-mail, téléphone et adresse de livraison.</p>
      <p>Ces données ne sont pas vendues. Le texte définitif doit être validé par la propriétaire de la boutique avant la mise en production.</p>
    </Page>
  );
}

/* ─────────────────────────────────────────────────────────────── */
const FAQ_ITEMS: [string, string][] = [
  ["Comment passer commande ?", "Ajoutez vos produits au panier puis validez la commande sur le site, ou écrivez-nous sur WhatsApp."],
  ["Dois-je créer un compte ?", "Un compte vous permet de suivre vos commandes et d'enregistrer vos adresses. La commande sans compte est possible si la boutique l'a activée."],
  ["Comment connaître les frais de livraison ?", "Ils s'affichent selon votre zone au moment de la commande. Si votre zone n'est pas listée, la boutique vous confirme les frais avant l'expédition."],
  ["Comment payer ?", "Les modes de règlement disponibles sont indiqués lors de la commande. Le paiement en ligne n'est pas encore proposé."],
  ["Comment suivre ma commande ?", "Connectez-vous à votre compte, rubrique Mes commandes, pour consulter son statut."],
];

export function Faq() {
  useDocumentTitle("Questions fréquentes");
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="mb-2 font-display text-4xl font-bold tracking-tight text-ink">Questions fréquentes</h1>
      <p className="mb-10 text-muted">Tout ce que vous devez savoir avant de commander.</p>
      <div className="space-y-3">
        {FAQ_ITEMS.map(([q, a], i) => (
          <div key={q} className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink transition-colors hover:bg-blush/40"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              {q}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open === i && (
              <div className="border-t border-line px-5 pb-4 pt-3 text-sm leading-relaxed text-muted">
                {a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
export function Contact() {
  useDocumentTitle("Contact");
  const { settings } = useSettings();
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errs, setErrs] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErrs(null);
    try {
      await post("/contact/", f);
      toast.success("Message envoyé. Nous vous répondrons rapidement.");
      setF({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (er) { if (er instanceof ApiError) setErrs(er); toast.error(errorMessage(er)); }
    finally { setBusy(false); }
  };

  return (
    <div className="container-page py-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
        {/* Infos contact */}
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Contact</h1>
          <p className="mt-3 text-muted">Une question sur un produit ou une commande ? Écrivez-nous.</p>

          <div className="mt-8 space-y-4">
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-plum/8 transition-colors group-hover:bg-plum/15">
                  <Mail className="h-5 w-5 text-plum" aria-hidden />
                </div>
                <span className="text-sm font-medium text-ink group-hover:text-plum transition-colors">
                  {settings.contact_email}
                </span>
              </a>
            )}
            {settings.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-plum/8 transition-colors group-hover:bg-plum/15">
                  <Phone className="h-5 w-5 text-plum" aria-hidden />
                </div>
                <span className="text-sm font-medium text-ink group-hover:text-plum transition-colors">
                  {settings.contact_phone}
                </span>
              </a>
            )}
          </div>

          <div className="mt-6">
            <WhatsAppButton lines={[]} label="Écrire sur WhatsApp" className="btn btn-primary" />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              Une conversation WhatsApp s'ouvre dans une nouvelle fenêtre.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="card space-y-4 p-6 shadow-md" noValidate>
          <h2 className="font-display text-xl font-bold text-ink">Envoyer un message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nom" required value={f.name} onChange={set("name")} error={errs?.field("name")} />
            <TextField label="E-mail" type="email" required value={f.email} onChange={set("email")} error={errs?.field("email")} />
          </div>
          <TextField label="Téléphone (facultatif)" type="tel" value={f.phone} onChange={set("phone")} error={errs?.field("phone")} />
          <TextField label="Sujet" required value={f.subject} onChange={set("subject")} error={errs?.field("subject")} />
          <TextArea label="Message" required rows={5} value={f.message} onChange={set("message")} error={errs?.field("message")} />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Envoi en cours…" : "Envoyer le message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
