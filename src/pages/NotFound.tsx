import { ButtonLink } from "../components/ui/Button";
import { useDocumentTitle } from "../hooks/useApi";

export default function NotFound() {
  useDocumentTitle("Page introuvable");
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-6xl text-champagne">404</p>
      <h1 className="mt-4 text-3xl">Cette page n'existe pas</h1>
      <p className="mt-2 text-muted">Le lien est peut-être incorrect ou la page a été déplacée.</p>
      <ButtonLink to="/" className="mt-6">Retour à l'accueil</ButtonLink>
    </div>
  );
}
