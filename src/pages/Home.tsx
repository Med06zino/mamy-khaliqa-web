import {
  ArrowRight,
  CheckCircle,
  Clock,
  Gift,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
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

  const accentBar  = accent === "beauty" ? "bg-plum"     : "bg-champagne";
  const accentBadge = accent === "beauty"
    ? "bg-plum/8 text-plum border-plum/15"
    : "bg-champagne/12 text-champagne/90 border-champagne/20";
  const bgSection  = accent === "beauty" ? "bg-ivory"    : "bg-surface";

  return (
    <section className={`${bgSection} py-12 sm:py-16`} aria-labelledby={`universe-${category.slug}`}>
      <div className="container-page">
        {/* En-tête */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {/* Filet accent */}
            <span className={`mb-2 block h-0.5 w-10 rounded-full ${accentBar}`} aria-hidden="true" />
            <h2
              id={`universe-${category.slug}`}
              className="font-display text-2xl font-bold text-ink sm:text-3xl"
            >
              {category.name}
            </h2>
            {category.description && (
              <p className="mt-1.5 max-w-lg text-sm text-muted">{category.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Badge univers */}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${accentBadge}`}>
              {/* <Sparkles className="h-3 w-3" aria-hidden /> */}
              {accent === "beauty" ? "Khaliqa Beauty" : "Khaliqa Hair"}
            </span>
            <Link
              to={`/boutique/categorie/${category.slug}`}
              className="group flex items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-plum-dark"
            >
              Voir tout
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Produits */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : data && data.results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        {/* En-tête de section */}
        <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
          <div>
            {title ? (
              <>
                <span
                  className="mb-2 block h-0.5 w-8 rounded-full bg-champagne"
                  aria-hidden="true"
                />
                <h2
                  id={titleId}
                  className="font-display text-2xl font-bold text-ink sm:text-3xl"
                >
                  {title}
                </h2>
              </>
            ) : (
              /* Skeleton pendant le chargement du libellé */
              <div
                className="h-8 w-48 animate-pulse rounded-lg bg-line"
                aria-hidden="true"
              />
            )}
          </div>

          {link && (
            <Link
              to={link.to}
              className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-plum-dark"
            >
              {link.label}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          )}
        </div>

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
        /* ── Hero de repli : image locale + texte ── */
        <section className="container-page py-8 sm:py-12">
          {/* Carte principale pleine largeur */}
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-blush shadow-lg">

            {/* Dégradé décoratif haut-droite */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-plum/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="grid min-h-[460px] items-stretch md:grid-cols-[55%_45%] lg:grid-cols-[52%_48%] lg:min-h-[540px]">

              {/* ── Colonne texte ───────────────────────── */}
              <div className="relative z-10 order-2 flex flex-col justify-center gap-6 px-8 py-12 sm:px-12 md:order-1 md:px-14 lg:px-16 lg:py-16">

                {/* Badge */}
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-plum/20 bg-white/70 px-4 py-2 backdrop-blur-sm">
                  {/* <Sparkles className="h-3.5 w-3.5 text-plum" aria-hidden="true" /> */}
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plum">
                    Beauté naturelle
                  </span>
                </div>

                {/* Titre */}
                <div>
                  <p className="mb-3 text-sm font-medium text-plum/60 tracking-wide">
                    {settings.name}
                  </p>
                  <h1 className="font-display text-[2.1rem] font-bold leading-[1.18] tracking-tight text-ink sm:text-5xl lg:text-[3.2rem]">
                    {settings.tagline}
                  </h1>
                </div>

                {/* Sous-titre */}
                <p className="max-w-[360px] text-[15px] leading-[1.75] text-muted">
                  Découvrez une sélection pensée pour prendre soin de vous,
                  livrée directement depuis le Sénégal.
                </p>

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/boutique"
                    className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-plum px-7 text-[13px] font-semibold text-ivory shadow-lg shadow-plum/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-plum-dark hover:shadow-xl hover:shadow-plum/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2"
                  >
                    Découvrir la boutique
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>

                  <Link
                    to="/a-propos"
                    className="inline-flex h-12 items-center gap-1.5 rounded-full px-5 text-[13px] font-semibold text-plum/80 transition-colors hover:text-plum"
                  >
                    En savoir plus
                  </Link>
                </div>

                {/* Indicateurs de confiance */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {[
                    "Livraison au Sénégal",
                    "Paiement à la livraison",
                    "Service WhatsApp",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-muted/70">
                      <span className="h-1 w-1 rounded-full bg-champagne" aria-hidden="true" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Colonne image ─────────────────────────── */}
              <div className="relative order-1 min-h-[260px] overflow-hidden md:order-2 md:min-h-0">
                <img
                  src="/placeholder/hero2.jfif"
                  alt="Sélection de produits cosmétiques Mamy Khaliqa"
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 hover:scale-[1.03]"
                />
                {/* Fondu latéral gauche vers le fond blush */}
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-blush to-transparent md:w-20"
                  aria-hidden="true"
                />
                {/* Fondu bas sur mobile */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blush to-transparent md:hidden"
                  aria-hidden="true"
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cats.data.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════
          4a. KHALIQA BEAUTY — produits cosmétiques
              La section s'affiche si une catégorie dont le slug
              contient "beauty" ou "beaute" existe et est active.
              Sinon elle est simplement masquée.
         ══════════════════════════════════════════════════════ */}
      {(() => {
        const beautyCategories = ["beauty", "beaute", "cosmetique", "cosmétique", "gloss", "soin-visage"];
        const beautyCat = cats.data?.find((c) =>
          beautyCategories.some((k) => c.slug.toLowerCase().includes(k)) ||
          c.name.toLowerCase().includes("beauty") ||
          c.name.toLowerCase().includes("beauté") ||
          c.name.toLowerCase().includes("cosmétique")
        );
        if (!beautyCat) return null;
        return <UniverseSection key={beautyCat.id} category={beautyCat} accent="beauty" />;
      })()}

      {/* ══════════════════════════════════════════════════════
          4b. KHALIQA HAIR — soins capillaires
              Même logique : slug ou nom contenant "hair", "capillaire", "cheveux".
         ══════════════════════════════════════════════════════ */}
      {(() => {
        const hairCategories = ["hair", "capillaire", "cheveux", "pousse-cils", "cils"];
        const hairCat = cats.data?.find((c) =>
          hairCategories.some((k) => c.slug.toLowerCase().includes(k)) ||
          c.name.toLowerCase().includes("hair") ||
          c.name.toLowerCase().includes("capillaire") ||
          c.name.toLowerCase().includes("cheveux") ||
          c.name.toLowerCase().includes("cils")
        );
        if (!hairCat) return null;
        return <UniverseSection key={hairCat.id} category={hairCat} accent="hair" />;
      })()}

      {/* ══════════════════════════════════════════════════════
          4c. MEILLEURES VENTES / À DÉCOUVRIR
              Affiché si les sections univers n'ont pas déjà tout couvert.
         ══════════════════════════════════════════════════════ */}
      {(best.loading || (best.data && best.data.results.length > 0)) && (
        <Section
          id="best-sellers"
          title={best.loading ? "" : bestTitle}
          link={{ to: "/boutique", label: "Voir tout" }}
          bg="bg-surface"
        >
          {best.loading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : best.error ? (
            <ErrorState message={best.error} onRetry={best.reload} />
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {best.data!.results.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ══════════════════════════════════════════════════════
          5. BANNIÈRE PROMOTIONNELLE (carrousel)
             Masquée si aucune bannière promo créée par l'admin.
         ══════════════════════════════════════════════════════ */}
      {!promos.loading && promos.data && promos.data.length > 0 && (
        <PromoBanner banners={promos.data} />
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
             Masqués s'il n'y a aucun avis approuvé.
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
