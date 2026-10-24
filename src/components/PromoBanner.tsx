import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { Banner } from "../types";

interface Props { banners: Banner[] }

/**
 * Carrousel promotionnel avec points de navigation — maquette 1, section "Pourquoi nous choisir".
 * Défilement automatique toutes les 5 s. Toutes les données viennent de l'API.
 * Si un seul bannière, pas de points ni d'auto-défilement.
 */
export function PromoBanner({ banners }: Props) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();
  const current = banners[idx];

  // Auto-défilement
  useEffect(() => {
    if (banners.length <= 1 || reduce) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length, reduce]);

  if (!current) return null;

  const target = current.link_url || "/boutique";

  return (
    <section aria-label="Offre promotionnelle" className="section bg-surface">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-4xl bg-blush">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reduce ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="grid min-h-[240px] items-center gap-6 px-8 py-10 sm:min-h-[280px] sm:px-12 md:grid-cols-[auto_1fr] md:gap-10 lg:px-16"
            >
              {/* Image */}
              <div className="hidden h-44 w-44 shrink-0 overflow-hidden rounded-3xl shadow-md md:block lg:h-52 lg:w-52">
                {current.image ? (
                  <img src={current.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blush-deep">
                    <ImageOff className="h-8 w-8 text-plum/20" aria-hidden />
                  </div>
                )}
              </div>

              {/* Texte */}
              <div>
                <h2 className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
                  {current.title}
                </h2>
                {current.subtitle && (
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{current.subtitle}</p>
                )}
                <Link
                  to={target}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-plum px-6 py-2.5 text-sm font-semibold text-ivory shadow-sm transition-all hover:bg-plum-dark hover:-translate-y-0.5"
                >
                  {current.button_text || "Voir l'offre"}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Points de carrousel */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2" role="tablist" aria-label="Diapositives">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Diapositive ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={i === idx ? "dot-active" : "dot-inactive"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
