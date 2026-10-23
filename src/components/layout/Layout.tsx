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
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-plum focus:px-4 focus:py-2 focus:text-ivory">Aller au contenu</a>
      <Header />
      <main id="contenu" className="flex-1"><Outlet /></main>
      <Footer />
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Discuter sur WhatsApp"
          className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-plum text-ivory shadow-lg hover:bg-plum-dark">
          <MessageCircle className="h-6 w-6" aria-hidden />
        </a>
      )}
    </div>
  );
}
