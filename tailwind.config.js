/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* ─── Palette Mamy Khaliqa ────────────────────────────── */
      colors: {
        blush:     "#F7E8E8",   // rose poudré — fond formulaires, fonds légers
        "blush-deep": "#F2D8D8", // rose un peu plus soutenu pour les fonds de carte
        plum:      { DEFAULT: "#713F52", dark: "#5A3242", light: "#8B5467" },
        champagne: "#C6A36A",   // or — filets et détails graphiques UNIQUEMENT
        ivory:     "#FFFDF9",   // fond global
        ink:       "#292329",   // texte principal (spec brand)
        muted:     "#746B72",   // texte secondaire (spec brand)
        line:      "#EAE0E4",   // séparateurs
        surface:   "#FDF5F5",   // fond section alternée légèrement rosé
        danger:    "#9B2C2C",
        success:   "#2F6B4F",
      },

      /* ─── Typographie ─────────────────────────────────────── */
      fontFamily: {
        // Poppins pour tous les grands titres (h1, h2, hero, sections)
        display: ['"Poppins"', "system-ui", "sans-serif"],
        // Inter + Plus Jakarta Sans pour les textes courants et l'UI
        sans:    ['"Plus Jakarta Sans"', "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        xs:    ["0.75rem",  { lineHeight: "1.125rem" }],
        sm:    ["0.875rem", { lineHeight: "1.375rem" }],
        base:  ["1rem",     { lineHeight: "1.625rem" }],
        lg:    ["1.125rem", { lineHeight: "1.75rem"  }],
        xl:    ["1.25rem",  { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.75rem", letterSpacing: "-0.01em" }],
        "5xl": ["3rem",     { lineHeight: "3.5rem",  letterSpacing: "-0.02em" }],
        "6xl": ["3.75rem",  { lineHeight: "4.25rem", letterSpacing: "-0.025em" }],
      },

      /* ─── Ombres douces (esprit beauté) ───────────────────── */
      boxShadow: {
        xs:          "0 1px 2px 0 rgba(113,63,82,0.04)",
        sm:          "0 2px 6px -1px rgba(113,63,82,0.08)",
        md:          "0 4px 12px -2px rgba(113,63,82,0.10)",
        lg:          "0 8px 24px -4px rgba(113,63,82,0.12)",
        card:        "0 2px 10px -2px rgba(113,63,82,0.08), 0 1px 4px -1px rgba(113,63,82,0.05)",
        "card-hover":"0 8px 28px -4px rgba(113,63,82,0.16), 0 2px 8px -2px rgba(113,63,82,0.08)",
        "inner-sm":  "inset 0 1px 3px 0 rgba(113,63,82,0.07)",
        // ombre spéciale formulaires auth (fond rose)
        "auth":      "0 4px 20px -4px rgba(113,63,82,0.14)",
      },

      /* ─── Arrondis ────────────────────────────────────────── */
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      /* ─── Animations ──────────────────────────────────────── */
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-dots": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%":      { transform: "scale(1.4)", opacity: "0.8" },
        },
      },
      animation: {
        shimmer:     "shimmer 1.8s linear infinite",
        "fade-up":   "fade-up 0.4s ease-out both",
        "fade-in":   "fade-in 0.25s ease-out both",
        "slide-dots":"slide-dots 1.2s ease-in-out infinite",
      },

      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
