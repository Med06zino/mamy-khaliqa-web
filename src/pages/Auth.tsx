import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useDocumentTitle } from "../hooks/useApi";
import { ApiError, errorMessage, post } from "../lib/api";
import { useAuth } from "../store/auth";
import { useFavorites } from "../store/favorites";
import { toast } from "../store/toast";

/* ══════════════════════════════════════════════════════════════
   COMPOSANTS INTERNES
══════════════════════════════════════════════════════════════ */

/**
 * Input souligné style maquette 3 —
 * fond transparent, bordure uniquement en bas, focus plum.
 */
function LineField(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
  },
) {
  const { label, error, className = "", ...rest } = props;
  return (
    <div className="group">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted/70">
        {label}
      </label>
      <input
        {...rest}
        aria-invalid={!!error}
        className={`
          w-full border-0 border-b-2 border-line bg-transparent
          pb-2 pt-1 text-sm text-ink placeholder:text-muted/40
          outline-none transition-all duration-200
          focus:border-plum
          aria-[invalid=true]:border-danger
          ${className}
        `}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Même style souligné mais avec toggle Afficher / Masquer.
 */
function LinePasswordField({
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="group">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted/70">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          placeholder="••••••••"
          className="
            w-full border-0 border-b-2 border-line bg-transparent
            pb-2 pt-1 pr-24 text-sm text-ink placeholder:text-muted/40
            outline-none transition-all duration-200
            focus:border-plum
            aria-[invalid=true]:border-danger
          "
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Masquer" : "Afficher"}
          className="
            absolute right-0 top-1/2 -translate-y-1/2
            flex items-center gap-1 text-[11px] font-semibold
            text-muted transition-colors hover:text-plum
          "
        >
          {show ? (
            <><EyeOff className="h-3.5 w-3.5" aria-hidden />Masquer</>
          ) : (
            <><Eye className="h-3.5 w-3.5" aria-hidden />Afficher</>
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Checkbox CGV */
function TermsField({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-plum"
        />
        <span className="text-xs leading-relaxed text-muted/80">
          En créant un compte, j&rsquo;accepte les{" "}
          <Link
            to="/conditions-generales"
            target="_blank"
            className="font-semibold text-plum hover:underline"
          >
            conditions générales
          </Link>{" "}
          et la{" "}
          <Link
            to="/confidentialite"
            target="_blank"
            className="font-semibold text-plum hover:underline"
          >
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Bouton CTA plein */
function AuthButton({
  busy,
  label,
  loadingLabel,
}: {
  busy: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="
        w-full rounded-xl bg-plum py-3 text-sm font-bold
        uppercase tracking-widest text-ivory
        shadow-md shadow-plum/20
        transition-all duration-200
        hover:-translate-y-0.5 hover:bg-plum-dark hover:shadow-lg
        disabled:cursor-not-allowed disabled:opacity-60
        active:translate-y-0
      "
    >
      {busy ? loadingLabel : label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   LAYOUT DEUX COLONNES (maquette 3)

   Desktop  : [visuel à gauche | formulaire à droite]
   Mobile   : formulaire seul, plein écran
══════════════════════════════════════════════════════════════ */
function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useDocumentTitle(title);

  return (
    <div className="flex min-h-[calc(100vh-70px)]">

      {/* ── Panneau gauche — visuel de marque ─────────────────
          Masqué sur mobile, visible à partir de lg.
         ────────────────────────────────────────────────────── */}
      <div
        className="
          relative hidden flex-col items-center justify-center
          overflow-hidden bg-blush lg:flex lg:w-[45%] xl:w-[42%]
        "
        aria-hidden="true"
      >
        {/* Photo de fond */}
        <img
          src="/placeholder/hero.jpeg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-60"
        />

        {/* Overlay dégradé */}
      </div>

      {/* ── Panneau droit — formulaire ─────────────────────────
          Pleine largeur sur mobile, 55 % sur desktop.
         ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-ivory px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">

          {/* Titre */}
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          )}

          {/* Formulaire */}
          <div className="mt-8">{children}</div>

          {/* Lien secondaire */}
          {footer && (
            <p className="mt-6 text-center text-sm text-muted">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE CONNEXION
══════════════════════════════════════════════════════════════ */
export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/compte";

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const u = await login(email, pwd);
      useFavorites.getState().load().catch(() => {});
      nav(u.is_staff && from === "/compte" ? "/admin" : from, { replace: true });
    } catch (er) {
      setErr(errorMessage(er));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Dalal Ak Djam"
      subtitle="Connectez-vous à votre compte"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link
            to="/inscription"
            className="font-semibold text-plum underline-offset-2 hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-6" noValidate>
        {err && (
          <p
            role="alert"
            className="rounded-xl bg-danger/8 px-4 py-2.5 text-sm font-medium text-danger"
          >
            {err}
          </p>
        )}

        <LineField
          label="Adresse e-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="votre@email.com"
        />

        <LinePasswordField
          label="Mot de passe"
          value={pwd}
          onChange={setPwd}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            to="/mot-de-passe-oublie"
            className="text-xs font-semibold text-danger hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <AuthButton busy={busy} label="Se connecter" loadingLabel="Connexion en cours…" />
      </form>
    </AuthLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE INSCRIPTION
══════════════════════════════════════════════════════════════ */
export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [f, setF] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirm: "",
    accept_terms: false,
  });
  const [errs, setErrs] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrs(null);
    try {
      await register(f);
      toast.success("Compte créé. Bienvenue !");
      nav("/compte", { replace: true });
    } catch (er) {
      if (er instanceof ApiError) setErrs(er);
      toast.error(errorMessage(er));
    } finally {
      setBusy(false);
    }
  };

  const t =
    (k: keyof typeof f) =>
    (e: { target: { value: string } }) =>
      setF({ ...f, [k]: e.target.value });

  const pwdErr = errs?.field("password") ?? errs?.field("non_field_errors");

  return (
    <AuthLayout
      title="Commençons"
      subtitle="Créez votre compte gratuitement"
      footer={
        <>
          Déjà inscrite ?{" "}
          <Link
            to="/connexion"
            className="font-semibold text-plum underline-offset-2 hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-5">
          <LineField
            label="Prénom"
            required
            value={f.first_name}
            onChange={t("first_name")}
            error={errs?.field("first_name")}
            autoComplete="given-name"
            placeholder="Awa"
          />
          <LineField
            label="Nom"
            required
            value={f.last_name}
            onChange={t("last_name")}
            error={errs?.field("last_name")}
            autoComplete="family-name"
            placeholder="Diop"
          />
        </div>

        <LineField
          label="Adresse e-mail"
          type="email"
          required
          value={f.email}
          onChange={t("email")}
          error={errs?.field("email")}
          autoComplete="email"
          placeholder="votre@email.com"
        />

        <LineField
          label="Téléphone"
          type="tel"
          required
          value={f.phone}
          onChange={t("phone")}
          error={errs?.field("phone")}
          autoComplete="tel"
          placeholder="+221 7X XXX XX XX"
        />

        <LinePasswordField
          label="Mot de passe"
          value={f.password}
          onChange={(v) => setF({ ...f, password: v })}
          error={pwdErr}
          autoComplete="new-password"
        />

        <LinePasswordField
          label="Confirmer le mot de passe"
          value={f.password_confirm}
          onChange={(v) => setF({ ...f, password_confirm: v })}
          error={errs?.field("password_confirm")}
          autoComplete="new-password"
        />

        <TermsField
          checked={f.accept_terms}
          onChange={(v) => setF({ ...f, accept_terms: v })}
          error={errs?.field("accept_terms")}
        />

        <AuthButton busy={busy} label="Créer mon compte" loadingLabel="Création en cours…" />
      </form>
    </AuthLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE MOT DE PASSE OUBLIÉ
══════════════════════════════════════════════════════════════ */
export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post<{ detail: string }>("/auth/password-reset/", { email });
      setDone(r.detail);
    } catch (er) {
      toast.error(errorMessage(er));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien de réinitialisation"
      footer={
        <Link to="/connexion" className="font-semibold text-plum hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {done ? (
        <p
          role="status"
          className="rounded-2xl bg-success/8 px-4 py-4 text-center text-sm font-medium text-success"
        >
          {done}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-6" noValidate>
          <LineField
            label="Adresse e-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
          <AuthButton busy={busy} label="Envoyer le lien" loadingLabel="Envoi en cours…" />
        </form>
      )}
    </AuthLayout>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE RÉINITIALISATION MOT DE PASSE
══════════════════════════════════════════════════════════════ */
export function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await post("/auth/password-reset/confirm/", {
        uid: sp.get("uid"),
        token: sp.get("token"),
        password: pwd,
      });
      toast.success("Mot de passe mis à jour.");
      nav("/connexion");
    } catch (er) {
      if (er instanceof ApiError) setErr(er);
      toast.error(errorMessage(er));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe sécurisé"
    >
      <form onSubmit={submit} className="space-y-6" noValidate>
        <LinePasswordField
          label="Nouveau mot de passe"
          value={pwd}
          onChange={setPwd}
          error={err?.field("password")}
          autoComplete="new-password"
        />
        <AuthButton busy={busy} label="Enregistrer" loadingLabel="Enregistrement…" />
      </form>
    </AuthLayout>
  );
}
