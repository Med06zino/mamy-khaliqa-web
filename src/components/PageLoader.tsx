import { AnimatePresence, motion } from "framer-motion";

import { useLoader } from "../store/loader";

/**
 * Loader global React — s'affiche au-dessus de toute l'interface.
 *
 * Trois animations simultanées :
 *  1. Anneau tournant plum + champagne
 *  2. Nom de marque avec pulsation douce
 *  3. Barre champagne qui s'étire rythmiquement
 *
 * Disparaît avec un fondu de 400 ms pour ne pas couper brusquement.
 * Ne bloque jamais le DOM sous-jacent (pointer-events: none quand invisible).
 */
export function PageLoader() {
  const visible = useLoader((s) => s.visible);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-7 bg-ivory"
          role="status"
          aria-label="Chargement en cours"
        >
          {/* ── Anneau ── */}
          <div className="relative h-16 w-16" aria-hidden="true">
            {/* Piste */}
            <div className="absolute inset-0 rounded-full border-[3px] border-line" />
            {/* Arc animé */}
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-transparent"
              style={{
                borderTopColor: "#713F52",   /* plum */
                borderRightColor: "#C6A36A", /* champagne */
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                ease: [0.6, 0.2, 0.4, 0.9],
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
            {/* Point central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-plum/40" />
            </div>
          </div>

          {/* ── Marque ── */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.span
              className="font-display text-2xl font-bold tracking-tight text-ink"
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              Mamy Khaliqa
            </motion.span>

            {/* Barre champagne animée */}
            <motion.div
              className="h-0.5 rounded-full"
              style={{
                background: "linear-gradient(90deg, #713F52, #C6A36A)",
              }}
              animate={{ width: ["28px", "52px", "28px"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Hair &amp; Beauty
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
