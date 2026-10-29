import {
  ArrowRight,
  Banknote,
  MessageCircle,
  Star,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { CategoryCard } from "../components/CategoryCard";
import { HeroBanner, HeroBannerSkeleton } from "../components/HeroBanner";
import { Newsletter } from "../components/Newsletter";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { PromoBanner } from "../components/PromoBanner";
import { ErrorState } from "../components/ui/States";
import { useApi, useDocumentTitle } from "../hooks/useApi";
import { useSettings } from "../store/settings";
import type {
  Banner, BestSellersResponse, Category, Paginated, ProductListItem, Review,
} from "../types";

/* ─────────────────────────────────────────────────────────────
   Éléments d'interface partagés
───────────────────────────────────────────────────────────── */

/* Lien "Voir tout" */
function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-plum-dark"
    >
      {label}
      <ArrowRight
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
        aria-hidden
      />
    </Link>
  );
}

/* Titre de section centré, avec filets de part et d'autre.
   Le lien "Voir tout" se place à droite sur ordinateur, sous le titre sur mobile. */
function SectionHeading({
  id, title, eyebrow, description, link, lineClass = "bg-champagne/60",
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  description?: string;
  link?: { to: string; label: string };
  lineClass?: string;
}) {
  return (
    <div className="mb-8 sm:mb-10">
      {eyebrow && (
        <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-plum">
          {eyebrow}
        </p>
      )}

      <div className="relative flex items-center justify-center gap-4">
        {title ? (
          <>
            <span className={`hidden h-px w-12 sm:block md:w-20 ${lineClass}`} aria-hidden="true" />
            <h2
              id={id}
              className="text-center font-sans text-sm font-semibold uppercase tracking-[0.2em] text-ink sm:text-base"
            >
              {title}
            </h2>
            <span className={`hidden h-px w-12 sm:block md:w-20 ${lineClass}`} aria-hidden="true" />
          </>
        ) : (
          /* Squelette pendant le chargement du libellé */
          <div className="h-6 w-48 animate-pulse rounded-lg bg-line" aria-hidden="true" />
        )}

        {link && (
          <div className="absolute right-0 hidden sm:block">
            <SeeAll to={link.to} label={link.label} />
          </div>
        )}
      </div>

      {description && (
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted">{description}</p>
      )}

      {link && (
        <div className="mt-4 text-center sm:hidden">
          <SeeAll to={link.to} label={link.label} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section Univers — produits filtrés par catégorie (slug)
   Rendu seulement si la catégorie existe dans la liste API.
───────────────────────────────────────────────────────────── */
interface UniverseSectionProps {
  category: Category;
  /** Couleur de l'accent visuel : "beauty" (prune) ou "hair" (champagne) */
  accent: "beauty" | "hair";
}

function UniverseSection({ category, accent }: UniverseSectionProps) {
  const { data, loading, error, reload } = useApi<Paginated<ProductListItem>>(
    `/products/?category=${category.slug}&page_size=4&ordering=-created_at`,
  );

  const lineClass = accent === "beauty" ? "bg-plum/40" : "bg-champagne/70";
  const bgSection = accent === "beauty" ? "bg-ivory" : "bg-surface";

  return (
    <section className={`${bgSection} py-12 sm:py-16`} aria-labelledby={`universe-${category.slug}`}>
      <div className="container-page">
        <SectionHeading
          id={`universe-${category.slug}`}
          eyebrow={accent === "beauty" ? "Khaliqa Beauty" : "Khaliqa Hair"}
          title={category.name}
          description={category.description || undefined}
          link={{ to: `/boutique/categorie/${category.slug}`, label: "Voir tout" }}
          lineClass={lineClass}
        />

        {/* Produits */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 min-w-0">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data && data.results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 min-w-0">
            {data.results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="rounded-2xl bg-blush py-10 text-center">
            <p className="text-sm text-muted">Les produits de cette gamme arrivent bientôt.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Wrapper de section ─────────────────────────────────────── */
function Section({
  id, title, link, children, bg = "bg-ivory",
}: {
  id?: string;
  title: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
  bg?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      className={`${bg} py-12 sm:py-16`}
      aria-labelledby={title ? titleId : undefined}
    >
      <div className="container-page">
        <SectionHeading id={titleId} title={title} link={link} />
        {children}
      </div>
    </section>
  );
}

/* ── Grilles skeleton ───────────────────────────────────────── */
function ProductGrid({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Points de confiance du hero (icône + libellé) ──────────── */
const HERO_POINTS = [
  { Icon: Truck,       label: "Livraison au Sénégal" },
  { Icon: Banknote,      label: "Paiement à la livraison" },
  { Icon: MessageCircle, label: "Service WhatsApp" },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE D'ACCUEIL
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { settings } = useSettings();
  useDocumentTitle("", `${settings.name} — cosmétiques livrés au Sénégal.`);

  /* ── Appels API ─────────────────────────────────────────────── */
  const heroes  = useApi<Banner[]>("/banners/?banner_type=hero");
  const promos  = useApi<Banner[]>("/banners/?banner_type=promo");
  const cats    = useApi<Category[]>("/categories/");
  const best    = useApi<BestSellersResponse>("/products/best-sellers/");
  const news    = useApi<Paginated<ProductListItem>>("/products/?ordering=-created_at&page_size=4");
  const reviews = useApi<Paginated<Review>>("/reviews/");

  /* ── Dérivations ────────────────────────────────────────────── */
  const heroBanner = heroes.data?.[0] ?? null;

  /* Libellé adapté selon source (vraies ventes ou repli) */
  const bestTitle = best.data?.is_fallback === false ? "Meilleures ventes" : "À découvrir";

  /* Si le repli a déjà des produits → masquer "Nouveautés" pour éviter les doublons */
  const bestIsFallbackWithProducts =
    best.data?.is_fallback === true && best.data.results.length > 0;
  const showNews = !best.loading && !bestIsFallbackWithProducts;

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          1. HERO
          ══════════════════════════════════════════════════════ */}
      {heroes.loading ? (
        <HeroBannerSkeleton />
      ) : heroBanner ? (
        <HeroBanner banner={heroBanner} storeName={settings.name} />
      ) : (
        /* ── Hero de repli : Design UI/UX en deux colonnes ── */
        <section className="relative overflow-hidden bg-blush-deep py-12 lg:py-20">
          <div className="container-page grid items-center gap-12 lg:grid-cols-2">
            
            {/* ── Colonne Texte (Gauche) ────────────────────────── */}
            <div className="flex flex-col items-start text-left z-10 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-1 w-8 bg-plum rounded-full" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-plum">
                  Beauté naturelle
                </span>
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl leading-[1.1] mb-3">
                {settings.tagline}
              </h1>

              <p className="text-sm font-medium text-muted mb-6">
                {settings.name}
              </p>

              <p className="max-w-lg text-base leading-relaxed text-muted mb-8">
                Découvrez une sélection pensée pour prendre soin de vous, livrée directement depuis le Sénégal.
              </p>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-3.5 mb-10">
                <Link
                  to="/boutique"
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-plum px-7 text-sm font-semibold text-ivory shadow-lg shadow-plum/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-plum-dark hover:shadow-xl hover:shadow-plum/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
                >
                  Découvrir la boutique
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  to="/a-propos"
                  className="inline-flex h-12 items-center gap-1.5 rounded-full px-6 text-sm font-semibold text-plum border border-plum/20 transition-all duration-200 hover:bg-plum/5 hover:border-plum/30"
                >
                  En savoir plus
                </Link>
              </div>

              {/* Points de confiance */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
                {HERO_POINTS.map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2.5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plum/10 text-plum">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium text-ink text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Colonne Visuel (Droite) ───────────────────────── */}
            <div className="relative flex justify-center items-center order-1 lg:order-2">
              <div className="absolute h-72 w-72 rounded-full bg-blush-deep/50 blur-3xl -z-10" />

              <div className="relative w-full max-w-sm aspect-[3/4]">
                <img
                  src="/placeholder/hre.png"
                  alt="Sélection de produits cosmétiques Mamy Khaliqa"
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover object-top "
                />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          3. CATÉGORIES — vue d'ensemble
          ══════════════════════════════════════════════════════ */}
      {!cats.loading && !cats.error && cats.data && cats.data.length > 0 && (
        <Section id="categories" title="Nos gammes" bg="bg-ivory">
          <div className="flex flex-wrap justify-center gap-4">
            {cats.data.map((c) => (
              <div key={c.id} className="w-[calc(50%-0.5rem)] sm:w-44">
                <CategoryCard category={c} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════
          5. BANNIÈRE PROMOTIONNELLE (carrousel)
          ══════════════════════════════════════════════════════ */}
      {!promos.loading && promos.data && promos.data.length > 0 && (
        <PromoBanner banners={promos.data} />
      )}

      {/* ══════════════════════════════════════════════════════
          4a. KHALIQA BEAUTY — produits cosmétiques
          ══════════════════════════════════════════════════════ */}
      {(() => {
        const beautyCat = cats.data?.find((c) => c.slug === "khaliqa-beauty");
        if (!beautyCat) return null;
        return <UniverseSection key={beautyCat.id} category={beautyCat} accent="beauty" />;
      })()}

      {/* ══════════════════════════════════════════════════════
          4b. KHALIQA HAIR — soins capillaires
          ══════════════════════════════════════════════════════ */}
      {(() => {
        const hairCat = cats.data?.find((c) => c.slug === "khaliqa-hair");
        if (!hairCat) return null;
        return <UniverseSection key={hairCat.id} category={hairCat} accent="hair" />;
      })()}

      {/* ══════════════════════════════════════════════════════
          4c. MEILLEURES VENTES / À DÉCOUVRIR
          ══════════════════════════════════════════════════════ */}
      {(best.loading || (best.data && best.data.results.length > 0)) && (
        <Section
          id="best-sellers"
          title={best.loading ? "" : bestTitle}
          link={{ to: "/boutique", label: "Voir tout" }}
          bg="bg-surface"
        >
          {best.loading ? (
            <ProductGrid />
          ) : best.error ? (
            <ErrorState message={best.error} onRetry={best.reload} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 min-w-0">
              {best.data!.results.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════
          6. NOUVEAUTÉS
          ══════════════════════════════════════════════════════ */}
      {showNews && (
        <Section
          id="nouveautes"
          title="Nouveautés"
          link={{ to: "/boutique?ordering=-created_at", label: "Tout voir" }}
          bg="bg-ivory"
        >
          {news.loading ? (
            <ProductGrid />
          ) : news.error ? (
            <ErrorState message={news.error} onRetry={news.reload} />
          ) : news.data && news.data.results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 min-w-0">
              {news.data.results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-blush py-12 text-center">
              <p className="text-sm text-muted">Les premiers produits arrivent bientôt.</p>
            </div>
          )}
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════
          7. AVIS CLIENTS
          ══════════════════════════════════════════════════════ */}
      {!reviews.loading && reviews.data && reviews.data.results.length > 0 && (
        <Section id="avis" title="Avis de nos clientes" bg="bg-surface">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.data.results.slice(0, 3).map((r) => (
              <figure
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm"
              >
                <div
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`Note : ${r.rating} sur 5`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < r.rating
                          ? "fill-champagne text-champagne"
                          : "text-line"
                      }`}
                      aria-hidden
                    />
                  ))}
                </div>

                {r.comment && (
                  <blockquote className="flex-1 text-sm leading-relaxed text-muted">
                    &ldquo;{r.comment}&rdquo;
                  </blockquote>
                )}

                <figcaption className="mt-auto flex items-center gap-2.5 border-t border-line pt-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum/10 font-display text-sm font-bold text-plum">
                    {r.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-ink">{r.author}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════
          8. NEWSLETTER
          ══════════════════════════════════════════════════════ */}
      <Newsletter />
    </>
  );
}



