import { Mail, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ApiError, errorMessage, post } from "../lib/api";
import { toast } from "../store/toast";

/**
 * Section newsletter — maquette 1 bas de page.
 * Appel réel POST /api/v1/newsletter/subscribe/.
 * Anti-doublon géré côté serveur (200 si déjà abonné, 201 si nouveau).
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await post<{ detail: string }>("/newsletter/subscribe/", { email });
      setDone(true);
      setEmail("");
      toast.success("Merci ! Vous êtes inscrite à notre communauté.");
    } catch (er) {
      toast.error(er instanceof ApiError ? er.message : errorMessage(er));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-blush section-sm" aria-labelledby="newsletter-title">
      <div className="container-page">
        <div className="mx-auto max-w-xl text-center">
          {/* Icône */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-plum/10">
            <Mail className="h-6 w-6 text-plum" aria-hidden />
          </div>

          <h2 id="newsletter-title" className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Rejoignez notre belle communauté
          </h2>
          <p className="mt-2 text-sm text-muted">
            Inscrivez-vous pour recevoir nos nouveautés, conseils beauté et offres exclusives.
          </p>

          {done ? (
            <p role="status" className="mt-6 rounded-2xl bg-white px-6 py-4 text-sm font-medium text-success shadow-sm">
              Merci ! Vous faites maintenant partie de la communauté Mamy Khaliqa.
            </p>
          ) : (
            <form
              onSubmit={submit}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              aria-label="Inscription newsletter"
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">Votre adresse e-mail</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre e-mail"
                className="input flex-1 !rounded-full !bg-white shadow-sm placeholder:text-muted/70"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="flex items-center justify-center gap-2 rounded-full bg-plum px-6 py-2.5 text-sm font-semibold text-ivory shadow-sm transition-all hover:bg-plum-dark hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              >
                <Send className="h-4 w-4" aria-hidden />
                {busy ? "Inscription…" : "S'abonner"}
              </button>
            </form>
          )}

          <p className="mt-3 text-xs text-muted">
            Pas de spam. Désinscription possible à tout moment.
          </p>
        </div>
      </div>
    </section>
  );
}
