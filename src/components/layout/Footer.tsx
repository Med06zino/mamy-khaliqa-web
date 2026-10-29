import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { whatsappUrl } from "../../lib/whatsapp";
import { useSettings } from "../../store/settings";

// Composant icône Snapchat personnalisé (SVG)
function SnapchatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4ZM12 6C9.79 6 8 7.79 8 10C8 11.1 8.9 12 10 12C11.1 12 12 11.1 12 10C12 11.1 12.9 12 14 12C15.1 12 16 11.1 16 10C16 7.79 14.21 6 12 6ZM12 14C10.9 14 10 14.9 10 16C10 17.1 10.9 18 12 18C13.1 18 14 17.1 14 16C14 14.9 13.1 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    { url: "https://www.snapchat.com/@mamy_cama24", label: "Snapchat", Icon: SnapchatIcon },
  ].filter((x) => x.url);

  return (
    <footer className="mt-20 border-t border-line bg-gradient-to-b from-white to-surface">
      {/* Corps */}
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">

        {/* Marque */}
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-3xl font-bold tracking-tight text-plum">Mamy Khaliqa</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Votre destination mode et beauté au Sénégal. Découvrez nos collections exclusives et profitez d'un service client exceptionnel.
          </p>
          {social.length > 0 && (
            <div className="mt-6 flex gap-3">
              {social.map(({ url, label, Icon }) => (
                <a
                  key={label} href={url} target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted shadow-sm transition-all hover:border-plum hover:bg-plum hover:text-white hover:shadow-md"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Informations */}
        <nav aria-label="Informations légales">
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted">Informations</p>
          <ul className="space-y-3">
            {INFO_LINKS.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="text-sm text-ink transition-colors hover:text-plum hover:underline decoration-2 underline-offset-4">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted">Contact</p>
          <ul className="space-y-4">
            <li>
              <a href="mailto:mamycama52@gmail.com" className="flex items-center gap-3 text-sm text-ink transition-colors hover:text-plum">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum/10">
                  <Mail className="h-4 w-4 text-plum" aria-hidden />
                </span>
                mamycama52@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+221771857134" className="flex items-center gap-3 text-sm text-ink transition-colors hover:text-plum">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum/10">
                  <Phone className="h-4 w-4 text-plum" aria-hidden />
                </span>
                +221 77 185 71 34
              </a>
            </li>
            <li>
              <a href="https://wa.me/221771857134" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-medium text-plum transition-colors hover:text-plum-dark">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <MessageCircle className="h-4 w-4 text-success" aria-hidden />
                </span>
                WhatsApp
              </a>
            </li>
            <li>
              <a href="https://www.snapchat.com/@mamy_cama24" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-ink transition-colors hover:text-plum">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum/10">
                  <SnapchatIcon className="h-4 w-4 text-plum" aria-hidden />
                </span>
                @mamy_cama24
              </a>
            </li>
          </ul>
        </div>

        {/* À propos */}
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted">À propos</p>
          <p className="text-sm leading-relaxed text-muted">
            Mamy Khaliqa s'engage à vous offrir les meilleurs produits de mode et de beauté.
            Livraison rapide dans tout le Sénégal et service client disponible 7j/7.
          </p>
          {s.address && (
            <div className="mt-4 flex items-start gap-3 text-sm text-muted">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum/10">
                <MapPin className="h-4 w-4 text-plum" aria-hidden />
              </span>
              {s.address}
            </div>
          )}
        </div>
      </div>

      {/* Bas */}
      <div className="border-t border-line bg-surface py-6">
        <div className="container-page flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Mamy Khaliqa. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-xs text-muted">
            <Link to="/conditions-generales" className="hover:text-plum transition-colors">
              Conditions générales
            </Link>
            <Link to="/confidentialite" className="hover:text-plum transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
