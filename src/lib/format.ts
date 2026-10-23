export const formatPrice = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f/g, " ")} FCFA`;
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
export const stockLabel = (s: string) =>
  s === "out_of_stock" ? "Rupture de stock" : s === "low_stock" ? "Stock limite" : "En stock";
