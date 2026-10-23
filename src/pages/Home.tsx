import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ProductCard } from "../components/ProductCard";
import { ButtonLink } from "../components/ui/Button";
import { ErrorState, Spinner } from "../components/ui/States";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { useSettings } from "../store/settings";
import type { Category, Paginated, ProductListItem, Review } from "../types";

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="container-page py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-3xl">{title}</h2>
        {link && <Link to={link.to} className="link flex items-center gap-1 text-sm">{link.label}<ArrowRight className="h-4 w-4" aria-hidden /></Link>}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const reduce = useReducedMotion();
  useDocumentTitle("", `${settings.name} : huile pousse-cils, gamme capillaire et gloss.`);
  const cats = useApi<Category[]>("/categories/");
  const news = useApi<Paginated<ProductListItem>>("/products/?ordering=-created_at&page_size=4");
  const best = useApi<ProductListItem[]>("/products/best-sellers/");
  const reviews = useApi<Paginated<Review>>("/reviews/");

  return (
    <>
      <section className="bg-blush">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 h-px w-16 bg-champagne" aria-hidden />
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">{settings.tagline}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Huile pousse-cils, soins capillaires et gloss : la sélection {settings.name}, livrée au Sénégal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/boutique">Découvrir la boutique</ButtonLink>
              <ButtonLink to="/a-propos" variant="secondary">Notre univers</ButtonLink>
            </div>
          </motion.div>
          <div className="grid grid-cols-3 gap-3" aria-hidden>
            {["bg-plum", "bg-champagne", "bg-ivory"].map((c, i) => (
              <div key={c} className={`${c} aspect-[3/5] rounded-t-full border border-line ${i === 1 ? "mt-10" : ""}`} />
            ))}
          </div>
        </div>
      </section>

      <Section title="Nos gammes">
        {cats.loading ? <Spinner /> : cats.error ? <ErrorState message={cats.error} onRetry={cats.reload} /> : (
          <div className="grid gap-4 sm:grid-cols-3">
            {cats.data?.map((c) => (
              <Link key={c.id} to={`/boutique/categorie/${c.slug}`} className="card group p-6 transition-colors hover:border-plum">
                <h3 className="text-2xl">{c.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-muted">{c.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-plum">Voir les produits<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Nouveautés" link={{ to: "/boutique?ordering=-created_at", label: "Tout voir" }}>
        {news.loading ? <Spinner /> : news.error ? <ErrorState message={news.error} onRetry={news.reload} /> :
          news.data && news.data.results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{news.data.results.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          ) : <p className="text-sm text-muted">Les premiers produits arrivent bientôt.</p>}
      </Section>

      {best.data && best.data.length > 0 && (
        <Section title="Meilleures ventes">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{best.data.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      <section className="bg-blush">
        <div className="container-page grid gap-8 py-14 md:grid-cols-2">
          <h2 className="text-3xl">La marque {settings.name}</h2>
          <div>
            <p className="leading-7 text-muted">Une sélection de produits cosmétiques pensée pour votre quotidien, proposée directement par la boutique et accompagnée par un service client joignable sur WhatsApp.</p>
            <Link to="/a-propos" className="link mt-4 inline-flex items-center gap-1 text-sm">En savoir plus<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </section>

      {reviews.data && reviews.data.results.length > 0 && (
        <Section title="Avis de nos clientes">
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.data.results.slice(0, 3).map((r) => (
              <figure key={r.id} className="card p-6">
                <p className="text-sm text-champagne" aria-label={`Note : ${r.rating} sur 5`}>{r.rating} / 5</p>
                <blockquote className="mt-2 text-sm leading-6">{r.comment}</blockquote>
                <figcaption className="mt-3 text-xs text-muted">{r.author}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
