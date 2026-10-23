import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { whatsappUrl } from "../../lib/whatsapp";
import { useSettings } from "../../store/settings";

export function Footer() {
  const { settings: s } = useSettings();
  const wa = whatsappUrl(s.whatsapp_number, `Bonjour ${s.name}`);
  const social = [
    { url: s.instagram_url, label: "Instagram", Icon: Instagram },
    { url: s.facebook_url, label: "Facebook", Icon: Facebook },
  ].filter((x) => x.url);
  return (
    <footer className="mt-20 border-t border-line bg-blush">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-plum">{s.name}</p>
          <p className="mt-2 max-w-sm text-sm text-muted">{s.footer_text || s.tagline}</p>
          {social.length > 0 && (
            <div className="mt-4 flex gap-2">
              {social.map(({ url, label, Icon }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-full border border-plum p-2.5 text-plum hover:bg-ivory"><Icon className="h-4 w-4" aria-hidden /></a>
              ))}
            </div>
          )}
        </div>
        <nav aria-label="Informations">
          <p className="mb-3 font-display text-lg">Informations</p>
          <ul className="space-y-2 text-sm text-muted">
            {[["/livraison", "Livraison"], ["/retours", "Retours et remboursements"], ["/faq", "FAQ"], ["/conditions-generales", "Conditions générales de vente"], ["/confidentialite", "Politique de confidentialité"]].map(([to, l]) => (
              <li key={to}><Link to={to} className="hover:text-plum">{l}</Link></li>))}
          </ul>
        </nav>
        <div>
          <p className="mb-3 font-display text-lg">Contact</p>
          <ul className="space-y-2 text-sm text-muted">
            {s.contact_email && <li className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden />{s.contact_email}</li>}
            {s.contact_phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4" aria-hidden />{s.contact_phone}</li>}
            {s.address && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />{s.address}</li>}
            {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-plum"><MessageCircle className="h-4 w-4" aria-hidden />Écrire sur WhatsApp</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">&copy; {new Date().getFullYear()} {s.name}. Tous droits réservés.</div>
    </footer>
  );
}
