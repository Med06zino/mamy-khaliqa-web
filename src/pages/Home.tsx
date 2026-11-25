import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight, Banknote, ChevronLeft, ChevronRight, MessageCircle, Star, Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  motion, AnimatePresence, useInView,
} from "framer-motion";

import { CategoryCard } from "../components/CategoryCard";
import { HeroBanner, HeroBannerSkeleton } from "../components/HeroBanner";
import { Newsletter } from "../components/Newsletter";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import { PromoBanner } from "../components/PromoBanner";
import { ErrorState } from "../components/ui/States";
import { useApi, useCategories, useDocumentTitle } from "../hooks/useApi";
import { useSettings } from "../store/settings";
import type {
  Banner, BestSellersResponse, Category, Paginated, ProductListItem, Review,
} from "../types";

/* ── Données statiques ──────────────────────────────────────── */
const HERO_SLIDES = [
  { src: "/placeholder/aura.jfif",  alt: "Sélection de produits cosmétiques Mamy Khaliqa" },
  { src: "/placeholder/hero.jpeg",  alt: "Khaliqa Hair" },
  { src: "/placeholder/hero2.jfif", alt: "Khaliqa Beauty" },
];

const HERO_POINTS = [
  { Icon: Truck,         label: "Livraison au Sénégal" },
  { Icon: Banknote,      label: "Paiement à la livraison" },
  { Icon: MessageCircle, label: "Service WhatsApp" },
];

const GRID = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 min-w-0";

/* ── Variants Framer Motion réutilisables ────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4 } },
};

/* ── Hook : déclenche l'animation une fois au scroll ─────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

/* ── Titre de section ───────────────────────────────────────── */
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
  const seeAll = link && (
    <Link
      to={link.to}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-plum transition-colors hover:text-plum-dark"
    >
      {link.label}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
    </Link>
  );
  const line = <span className={`hidden h-px w-12 sm:block md:w-20 ${lineClass}`} aria-hidden="true" />;

  return (
    <div className="mb-8 sm:mb-10">
      {eyebrow && (
        <motion.p
          variants={fadeIn}
          className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-plum"
        >
          {eyebrow}
        </motion.p>
      )}
      <div className="relative flex items-center justify-center gap-4">
        {title ? (
          <>
            {line}
            <motion.h2
              variants={fadeUp}
              id={id}
              className="text-center font-sans text-sm font-semibold uppercase tracking-[0.2em] text-ink sm:text-base"
            >
              {title}
            </motion.h2>
            {line}
          </>
        ) : (
          <div className="h-6 w-48 animate-pulse rounded-lg bg-line" aria-hidden="true" />
        )}
        {seeAll && <div className="absolute right-0 hidden sm:block">{seeAll}</div>}
      </div>
      {description && (
        <motion.p variants={fadeUp} className="mx-auto mt-3 max-w-lg text-center text-sm text-muted">
          {description}
        </motion.p>
      )}
      {seeAll && <div className="mt-4 text-center sm:hidden">{seeAll}</div>}
    </div>
  );
}

/* ── Wrapper de section avec animation au scroll ────────────── */
function Section({
  id, title, link, children, bg = "bg-ivory", ...heading
}: {
  id?: string;
  title: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
  bg?: string;
  eyebrow?: string;
  description?: string;
  lineClass?: string;
}) {
  const { ref, inView } = useReveal();
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section id={id} className={`${bg} py-12 sm:py-16`} aria-labelledby={title ? titleId : undefined}>
      <div className="container-page">
        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          <SectionHeading id={titleId} title={title} link={link} {...heading} />
          <motion.div variants={fadeUp}>{children}</motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Grille produits ────────────────────────────────────────── */
function ProductsBlock({
  loading, error, reload, items, emptyText,
}: {
  loading: boolean;
  error?: string | null;
  reload: () => void;
  items?: ProductListItem[];
  emptyText: string;
}) {
  if (loading) return (
    <div className={GRID}>
      {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!items?.length) return (
    <div className="rounded-2xl bg-blush py-10 text-center">
      <p className="text-sm text-muted">{emptyText}</p>
    </div>
  );
  return (
    <motion.div
      className={GRID}
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {items.slice(0, 4).map((p) => (
        <motion.div key={p.id} variants={fadeUp}>
          <ProductCard product={p} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Section Univers ────────────────────────────────────────── */
function UniverseSection({ category, accent }: { category: Category; accent: "beauty" | "hair" }) {
  const { data, loading, error, reload } = useApi<Paginated<ProductListItem>>(
    `/products/?category=${category.slug}&page_size=4&ordering=-created_at`,
  );
  const beauty = accent === "beauty";

  return (
    <Section
      id={`universe-${category.slug}`}
      eyebrow={beauty ? "Khaliqa Beauty" : "Khaliqa Hair"}
      title={category.name}
      description={category.description || undefined}
      link={{ to: `/boutique/categorie/${category.slug}`, label: "Voir tout" }}
      lineClass={beauty ? "bg-plum/40" : "bg-champagne/70"}
      bg={beauty ? "bg-ivory" : "bg-surface"}
    >
      <ProductsBlock
        loading={loading} error={error} reload={reload}
        items={data?.results} emptyText="Les produits de cette gamme arrivent bientôt."
      />
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO SLIDER — avec Framer Motion
═══════════════════════════════════════════════════════════════ */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HeroSlider() {
  const [[index, dir], setSlide] = useState([0, 0]);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const total = HERO_SLIDES.length;
  const multi = total > 1;

  const go = useCallback((d: number) => {
    setSlide(([i]) => [(i + d + total) % total, d]);
  }, [total]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!multi || paused || reduce) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [multi, paused, go]);

  const arrowClass =
    "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-md backdrop-blur-sm transition hover:bg-white hover:scale-105 sm:flex";

  return (
    <section aria-label="Mise en avant" className="bg-ivory">
      {/* ── Slider ──────────────────────────────────────────────── */}
      <div
        className="relative h-[440px] w-full overflow-hidden bg-blush-deep sm:h-[520px] lg:h-[640px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* Arrière-plan doux — image courante floutée */}
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={`bg-${index}`}
            custom={dir}
            variants={{
              enter: { opacity: 0 },
              center: { opacity: 1, transition: { duration: 1 } },
              exit:   { opacity: 0, transition: { duration: 0.5 } },
            }}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
            aria-hidden="true"
          >
            <img
              src={HERO_SLIDES[index].src}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-50 blur-2xl"
            />
          </motion.div>
        </AnimatePresence>

        {/* Image principale avec slide */}
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.img
              src={HERO_SLIDES[index].src}
              alt={HERO_SLIDES[index].alt}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-contain object-top"
              initial={{ scale: 1.04 }}
              animate={{ scale: 1, transition: { duration: 6, ease: "linear" } }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Dégradé bas */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent"
          aria-hidden="true"
        />

        {/* CTA + dots */}
        <div className="absolute inset-x-0 bottom-0 z-20 pb-6 sm:pb-10">
          <div className="container-page flex flex-wrap items-end justify-between gap-4">

            {/* Texte + boutons animés */}
            <motion.div
              key={`cta-${index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                to="/boutique"
                className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-plum px-7 text-sm font-semibold text-ivory shadow-lg shadow-plum/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-plum-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                Découvrir la boutique
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                to="/a-propos"
                className="inline-flex h-12 items-center rounded-full border border-white/70 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                En savoir plus
              </Link>
            </motion.div>

            {/* Dots de navigation */}
            {multi && (
              <div className="flex items-center gap-2 pb-1">
                {HERO_SLIDES.map((s, i) => (
                  <motion.button
                    key={s.src}
                    type="button"
                    onClick={() => setSlide([i, i > index ? 1 : -1])}
                    aria-label={`Image ${i + 1}`}
                    aria-current={i === index}
                    animate={{
                      width: i === index ? 28 : 8,
                      backgroundColor: i === index ? "#ffffff" : "rgba(255,255,255,0.45)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="h-2 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flèches */}
        {multi && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Image précédente" className={`${arrowClass} left-4 lg:left-8`}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Image suivante" className={`${arrowClass} right-4 lg:right-8`}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* ── Bande de confiance animée ───────────────────────────── */}
      <motion.ul
        className="container-page grid grid-cols-1 gap-4 border-b border-line py-5 sm:grid-cols-3 sm:gap-6"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {HERO_POINTS.map(({ Icon, label }) => (
          <motion.li
            key={label}
            variants={fadeUp}
            className="flex items-center justify-center gap-3"
          >
            <motion.span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plum/10 text-plum"
              whileHover={{ scale: 1.12, rotate: 4 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </motion.span>
            <span className="text-sm font-medium text-ink">{label}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AVIS CLIENTS
═══════════════════════════════════════════════════════════════ */
function ReviewCard({ review }: { review: Review }) {
  return (
    <motion.figure
      variants={fadeUp}
      whileHover={{ y: -4, boxShadow: "0 12px 32px -6px rgba(113,63,82,0.14)" }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm"
    >
      <div className="flex gap-0.5" role="img" aria-label={`Note : ${review.rating} sur 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < review.rating ? "fill-champagne text-champagne" : "text-line"}`}
            aria-hidden
          />
        ))}
      </div>
      {review.comment && (
        <blockquote className="flex-1 text-sm leading-relaxed text-muted">
          &ldquo;{review.comment}&rdquo;
        </blockquote>
      )}
      <figcaption className="mt-auto flex items-center gap-2.5 border-t border-line pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum/10 font-display text-sm font-bold text-plum">
          {review.author.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-ink">{review.author}</span>
      </figcaption>
    </motion.figure>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE D'ACCUEIL
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { settings } = useSettings();
  useDocumentTitle("", `${settings.name} — cosmétiques livrés au Sénégal.`);

  const heroes  = useApi<Banner[]>("/banners/?banner_type=hero");
  const promos  = useApi<Banner[]>("/banners/?banner_type=promo");
  const cats    = useCategories();
  const best    = useApi<BestSellersResponse>("/products/best-sellers/");
  const news    = useApi<Paginated<ProductListItem>>("/products/?ordering=-created_at&page_size=4");
  const reviews = useApi<Paginated<Review>>("/reviews/");

  const heroBanner = heroes.data?.[0] ?? null;
  const bestTitle  = best.data?.is_fallback === false ? "Meilleures ventes" : "À découvrir";
  const showNews   = !best.loading && !(best.data?.is_fallback && best.data.results.length > 0);

  const universes = [
    { slug: "khaliqa-beauty", accent: "beauty" as const },
    { slug: "khaliqa-hair",   accent: "hair"   as const },
  ];

  /* Ref pour l'animation des avis */
  const { ref: reviewsRef, inView: reviewsInView } = useReveal();

  return (
    <>
      {/* 1. HERO */}
      {heroes.loading ? (
        <HeroBannerSkeleton />
      ) : heroBanner ? (
        <HeroBanner banner={heroBanner} storeName={settings.name} />
      ) : (
        <HeroSlider />
      )}

      {/* 2. CATÉGORIES */}
      {cats.data && cats.data.length > 0 && (
        <Section id="categories" title="Nos gammes">
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {cats.data.map((c) => (
              <motion.div
                key={c.id}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="w-[calc(50%-0.5rem)] sm:w-44"
              >
                <CategoryCard category={c} />
              </motion.div>
            ))}
          </motion.div>
        </Section>
      )}

      {/* 3. PROMOTIONS */}
      {promos.data && promos.data.length > 0 && <PromoBanner banners={promos.data} />}

      {/* 4. UNIVERS BEAUTY / HAIR */}
      {universes.map(({ slug, accent }) => {
        const cat = cats.data?.find((c) => c.slug === slug);
        return cat ? <UniverseSection key={cat.id} category={cat} accent={accent} /> : null;
      })}

      {/* 5. MEILLEURES VENTES */}
      {(best.loading || (best.data && best.data.results.length > 0)) && (
        <Section
          id="best-sellers"
          title={best.loading ? "" : bestTitle}
          link={{ to: "/boutique", label: "Voir tout" }}
          bg="bg-surface"
        >
          <ProductsBlock
            loading={best.loading} error={best.error} reload={best.reload}
            items={best.data?.results} emptyText=""
          />
        </Section>
      )}

      {/* 6. NOUVEAUTÉS */}
      {showNews && (
        <Section
          id="nouveautes"
          title="Nouveautés"
          link={{ to: "/boutique?ordering=-created_at", label: "Tout voir" }}
        >
          <ProductsBlock
            loading={news.loading} error={news.error} reload={news.reload}
            items={news.data?.results} emptyText="Les premiers produits arrivent bientôt."
          />
        </Section>
      )}

      {/* 7. AVIS CLIENTS */}
      {reviews.data && reviews.data.results.length > 0 && (
        <section id="avis" className="bg-surface py-12 sm:py-16" aria-labelledby="avis-title">
          <div className="container-page">
            <motion.div
              ref={reviewsRef}
              variants={stagger}
              initial="hidden"
              animate={reviewsInView ? "show" : "hidden"}
            >
              <SectionHeading id="avis-title" title="Avis de nos clientes" />
              <motion.div
                variants={stagger}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {reviews.data.results.slice(0, 3).map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* 8. NEWSLETTER */}
      <Newsletter />
    </>
  );
}
