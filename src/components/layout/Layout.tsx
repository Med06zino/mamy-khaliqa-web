import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { whatsappUrl } from "../../lib/whatsapp";
import { useSettings } from "../../store/settings";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { pathname } = useLocation();
  const { settings } = useSettings();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const wa = whatsappUrl(settings.whatsapp_number, `Bonjour ${settings.name}`);

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      {/* Lien d'évitement */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-plum focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ivory focus:shadow-md"
      >
        Aller au contenu
      </a>

      <Header />

      <main id="contenu" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Bouton WhatsApp flottant — numéro officiel 221710497804 en fallback */}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discuter avec Mamy sur WhatsApp"
          className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-plum text-ivory shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-plum-dark hover:shadow-xl"
        >
          <MessageCircle className="h-7 w-7" aria-hidden />
        </a>
      )}
    </div>
  );
}
