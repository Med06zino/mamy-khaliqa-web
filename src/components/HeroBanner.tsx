import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";

import type { Banner } from "../types";

interface Props {
  banner: Banner;
  storeName: string;
}

/**
 * Bandeau hero arrondi : texte à gauche, grande photo à droite.
 * Reproduction de la maquette 1. Toutes les données viennent de l'API.
 */
export function HeroBanner({ banner, storeName }: Props) {
  const reduce = useReducedMotion();
  const target = banner.link_url || "/boutique";

  return (
    <section aria-label="Bannière principale" className="container-page py-6 sm:py-8">
      <div className="overflow-hidden rounded-4xl bg-blush">
        <div className="grid min-h-[340px] items-center gap-6 px-8 py-10 sm:min-h-[420px] sm:px-12 sm:py-14 md:grid-cols-2 md:gap-10 lg:px-16">

          {/* ── Texte ────────────────────────────────────────── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="order-2 md:order-1"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-plum/60">
              {storeName}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
                {banner.subtitle}
              </p>
            )}
            <Link
              to={target}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-plum px-6 py-3 text-sm font-semibold text-ivory shadow-sm transition-all hover:bg-plum-dark hover:-translate-y-0.5 hover:shadow-md"
            >
              {banner.button_text || "Découvrir la boutique"}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>

          {/* ── Photo ────────────────────────────────────────── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="order-1 flex justify-center md:order-2 md:justify-end"
          >
            <div className="relative h-56 w-56 overflow-hidden rounded-3xl shadow-lg sm:h-72 sm:w-72 lg:h-80 lg:w-80">
              {banner.image ? (
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blush-deep">
                  <ImageOff className="h-10 w-10 text-plum/20" aria-label="Photo à venir" />
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

/** Skeleton du hero — affiché pendant le chargement. */
export function HeroBannerSkeleton() {
  return (
    <div className="container-page py-6 sm:py-8">
      <div className="overflow-hidden rounded-4xl bg-blush">
        <div className="grid min-h-[340px] items-center gap-6 px-8 py-10 md:grid-cols-2 sm:min-h-[420px]">
          <div className="order-2 space-y-4 md:order-1">
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton h-10 w-4/5 rounded-2xl" />
            <div className="skeleton h-10 w-3/5 rounded-2xl" />
            <div className="skeleton h-5 w-full rounded-xl" />
            <div className="skeleton h-5 w-4/5 rounded-xl" />
            <div className="skeleton h-11 w-48 rounded-full" />
          </div>
          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <div className="skeleton h-56 w-56 rounded-3xl sm:h-72 sm:w-72" />
          </div>
        </div>
      </div>
    </div>
  );
}
