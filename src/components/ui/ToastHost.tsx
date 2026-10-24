import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

import { useToast } from "../../store/toast";

const ICON = { success: CheckCircle2, error: CircleAlert, info: Info };
const TONE = {
  success: "text-success bg-success/8 border-success/20",
  error:   "text-danger  bg-danger/8  border-danger/20",
  info:    "text-plum    bg-plum/6    border-plum/20",
};

export function ToastHost() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <motion.div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-md ${TONE[t.kind]}`}
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${TONE[t.kind]}`}>
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <p className="flex-1 pt-0.5 text-sm font-medium text-ink">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Fermer la notification"
                className="mt-0.5 rounded-lg p-1 text-muted transition-colors hover:bg-line"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
