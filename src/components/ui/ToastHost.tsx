import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

import { useToast } from "../../store/toast";

const ICON = { success: CheckCircle2, error: CircleAlert, info: Info };
const TONE = { success: "text-success", error: "text-danger", info: "text-plum" };

export function ToastHost() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-lg">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${TONE[t.kind]}`} aria-hidden />
            <p className="flex-1 text-sm">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Fermer la notification"><X className="h-4 w-4 text-muted" aria-hidden /></button>
          </div>
        );
      })}
    </div>
  );
}
