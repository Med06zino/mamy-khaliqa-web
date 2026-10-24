import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ProductCard } from "../components/ProductCard";
import Cart from "../pages/Cart";
import NotFound from "../pages/NotFound";
import type { ProductListItem } from "../types";

const product: ProductListItem = {
  id: 1, name: "Gloss Rose", slug: "gloss-rose", sku: "G1", price: 5000, compare_at_price: null, volume: "", short_description: "",
  category: { id: 1, name: "Gloss", slug: "gloss" }, main_image: null, available_stock: 0,
  stock_status: "out_of_stock", has_variants: false, is_featured: false, created_at: "",
};

describe("pages", () => {
  it("affiche un panier vide avec un lien vers la boutique", () => {
    render(<MemoryRouter><Cart /></MemoryRouter>);
    expect(screen.getByText("Votre panier est vide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voir la boutique" })).toHaveAttribute("href", "/boutique");
  });
  it("affiche la page 404", () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByText("Cette page n'existe pas")).toBeInTheDocument();
  });
  it("desactive l'ajout au panier en rupture et nomme les boutons icone", () => {
    render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Ajouter Gloss Rose au panier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /favoris/ })).toBeInTheDocument();
    expect(screen.getByText("Rupture de stock")).toBeInTheDocument();
    expect(screen.getByText("5 000 FCFA")).toBeInTheDocument();
  });
});
