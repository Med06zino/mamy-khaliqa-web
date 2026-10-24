import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { whatsappUrl } from "../../lib/whatsapp";
import { useSettings } from "../../store/settings";

const INFO_LINKS = [
  ["/livraison", "Livraison"],
  ["/retours", "Retours et remboursements"],
  ["/faq", "Questions fréquentes"],
  ["/conditions-generales", "Conditions générales"],
  ["/confidentialite", "Politique de confidentialité"],
] as const;

export function Footer() {
  const { settings: s } = useSettings();
  const wa = whatsappUrl(s.whatsapp_number, `Bonjour ${s.name}`);

  const social = [
    { url: s.instagram_url, label: "Instagram", Icon: Instagram },
    { url: s.facebook_url,  label: "Facebook",  Icon: Facebook  },
  ].filter((x) => x.url);

  return (
    <footer className="mt-20 border-t border-line bg-white">
      {/* Corps */}
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">

        {/* Marque */}
        <div className="sm:col-span-2 md:col-span-2">
          <p className="font-display text-2xl font-bold tracking-tight text-plum">{s.name}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {s.footer_text || s.tagline}
          </p>
          {social.length > 0 && (
            <div className="mt-5 flex gap-2">
              {social.map(({ url, label, Icon }) => (
                <a
                  key={label} href={url} target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition-all hover:border-plum hover:bg-blush hover:text-plum"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Informations */}
        <nav aria-label="Informations légales">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Informations</p>
          <ul className="space-y-2.5">
            {INFO_LINKS.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-sm text-ink transition-colors hover:text-plum">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Contact</p>
          <ul className="space-y-3">
            {s.contact_email && (
              <li>
                <a href={`mailto:${s.contact_email}`} className="flex items-center gap-2.5 text-sm text-ink transition-colors hover:text-plum">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blush">
                    <Mail className="h-3.5 w-3.5 text-plum" aria-hidden />
                  </span>
                  {s.contact_email}
                </a>
              </li>
            )}
            {s.contact_phone && (
              <li>
                <a href={`tel:${s.contact_phone}`} className="flex items-center gap-2.5 text-sm text-ink transition-colors hover:text-plum">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blush">
                    <Phone className="h-3.5 w-3.5 text-plum" aria-hidden />
                  </span>
                  {s.contact_phone}
                </a>
              </li>
            )}
            {s.address && (
              <li className="flex items-start gap-2.5 text-sm text-muted">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blush">
                  <MapPin className="h-3.5 w-3.5 text-plum" aria-hidden />
                </span>
                {s.address}
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm font-medium text-plum transition-colors hover:text-plum-dark">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-plum/10">
                    <MessageCircle className="h-3.5 w-3.5 text-plum" aria-hidden />
                  </span>
                  Écrire sur WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bas */}
      <div className="border-t border-line py-5">
        <p className="text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} {s.name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
