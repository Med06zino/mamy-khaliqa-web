import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { CheckField, TextField } from "../components/ui/Field";
import { useDocumentTitle } from "../hooks/useApi";
import { ApiError, errorMessage, post } from "../lib/api";
import { useAuth } from "../store/auth";
import { useFavorites } from "../store/favorites";
import { toast } from "../store/toast";

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  useDocumentTitle(title);
  return (
    <div className="container-page flex justify-center py-14">
      <div className="card w-full max-w-md p-8">
        <h1 className="mb-6 text-3xl">{title}</h1>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}

function PasswordField(p: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextField label={p.label} type={show ? "text" : "password"} required value={p.value} onChange={(e) => p.onChange(e.target.value)} error={p.error} autoComplete={p.autoComplete} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-2 top-[34px] rounded p-2 text-muted">
        {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/compte";
  const [email, setEmail] = useState(""); const [pwd, setPwd] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const u = await login(email, pwd); useFavorites.getState().load().catch(() => {}); nav(u.is_staff && from === "/compte" ? "/admin" : from, { replace: true }); }
    catch (er) { setErr(errorMessage(er)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Connexion" footer={<>Pas encore de compte ? <Link to="/inscription" className="link">Créer un compte</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <p role="alert" className="rounded-lg bg-blush p-3 text-sm text-danger">{err}</p>}
        <TextField label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordField label="Mot de passe" value={pwd} onChange={setPwd} autoComplete="current-password" />
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Connexion en cours" : "Se connecter"}</Button>
        <p className="text-center text-sm"><Link to="/mot-de-passe-oublie" className="link">Mot de passe oublié ?</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "", password_confirm: "", accept_terms: false });
  const [errs, setErrs] = useState<ApiError | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErrs(null);
    try { await register(f); toast.success("Compte créé. Bienvenue !"); nav("/compte", { replace: true }); }
    catch (er) { if (er instanceof ApiError) setErrs(er); toast.error(errorMessage(er)); } finally { setBusy(false); }
  };
  const t = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const pwdErr = errs?.field("password") ?? errs?.field("non_field_errors");
  return (
    <Shell title="Créer un compte" footer={<>Déjà inscrite ? <Link to="/connexion" className="link">Se connecter</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Prénom" required value={f.first_name} onChange={t("first_name")} error={errs?.field("first_name")} autoComplete="given-name" />
          <TextField label="Nom" required value={f.last_name} onChange={t("last_name")} error={errs?.field("last_name")} autoComplete="family-name" />
        </div>
        <TextField label="E-mail" type="email" required value={f.email} onChange={t("email")} error={errs?.field("email")} autoComplete="email" />
        <TextField label="Téléphone" type="tel" required value={f.phone} onChange={t("phone")} error={errs?.field("phone")} autoComplete="tel" />
        <PasswordField label="Mot de passe" value={f.password} onChange={(v) => setF({ ...f, password: v })} error={pwdErr} autoComplete="new-password" />
        <PasswordField label="Confirmer le mot de passe" value={f.password_confirm} onChange={(v) => setF({ ...f, password_confirm: v })} error={errs?.field("password_confirm")} autoComplete="new-password" />
        <CheckField checked={f.accept_terms} onChange={(e) => setF({ ...f, accept_terms: e.target.checked })}
          label={<>J'accepte les <Link to="/conditions-generales" className="link" target="_blank">conditions générales de vente</Link> et la <Link to="/confidentialite" className="link" target="_blank">politique de confidentialité</Link>.</>} />
        {errs?.field("accept_terms") && <p role="alert" className="text-xs text-danger">{errs.field("accept_terms")}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Création en cours" : "Créer mon compte"}</Button>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState(""); const [done, setDone] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const r = await post<{ detail: string }>("/auth/password-reset/", { email }); setDone(r.detail); } catch (er) { toast.error(errorMessage(er)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Mot de passe oublié" footer={<Link to="/connexion" className="link">Retour à la connexion</Link>}>
      {done ? <p role="status" className="text-sm text-muted">{done}</p> : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-sm text-muted">Saisissez votre e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
          <TextField label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Envoi en cours" : "Envoyer le lien"}</Button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams(); const nav = useNavigate();
  const [pwd, setPwd] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiError | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await post("/auth/password-reset/confirm/", { uid: sp.get("uid"), token: sp.get("token"), password: pwd }); toast.success("Mot de passe mis à jour."); nav("/connexion"); }
    catch (er) { if (er instanceof ApiError) setErr(er); toast.error(errorMessage(er)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Nouveau mot de passe">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <PasswordField label="Nouveau mot de passe" value={pwd} onChange={setPwd} error={err?.field("password")} autoComplete="new-password" />
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Enregistrement" : "Enregistrer"}</Button>
      </form>
    </Shell>
  );
}
