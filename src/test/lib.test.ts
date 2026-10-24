import { beforeEach, describe, expect, it } from "vitest";

import { formatPrice } from "../lib/format";
import { buildWhatsAppMessage, whatsappUrl } from "../lib/whatsapp";
import { cartSubtotal, useCart } from "../store/cart";

describe("format", () => {
  it("formate les prix en FCFA", () => {
    expect(formatPrice(12500)).toBe("12 500 FCFA");
  });
});

describe("whatsapp", () => {
  const lines = [{ name: "Gloss Rose", variant: "10 ml", quantity: 2, unitPrice: 5000, url: "https://x.sn/boutique/gloss" }];
  it("construit un message complet avec sous-total et reference", () => {
    const m = buildWhatsAppMessage({ storeName: "Mamy Khaliqa", lines, reference: "MK-1" });
    expect(m).toContain("Gloss Rose (10 ml) x2");
    expect(m).toContain("10 000 FCFA");
    expect(m).toContain("MK-1");
    expect(m).toContain("https://x.sn/boutique/gloss");
  });
  it("encode correctement l'URL et nettoie le numero", () => {
    const u = whatsappUrl("+221 77 000 00 00", "Bonjour & merci\nok")!;
    expect(u.startsWith("https://wa.me/221770000000?text=")).toBe(true);
    expect(u).toContain(encodeURIComponent("Bonjour & merci\nok"));
  });
  it("utilise le numéro officiel de secours si aucun numéro n'est configuré", () => {
    const u1 = whatsappUrl("", "x");
    const u2 = whatsappUrl(undefined, "x");
    // Le numéro officiel 221710497804 est utilisé en fallback — le bouton est toujours actif
    expect(u1).toContain("https://wa.me/221710497804");
    expect(u2).toContain("https://wa.me/221710497804");
  });
});

describe("panier", () => {
  beforeEach(() => useCart.getState().clear());
  const item = { productId: 1, variantId: null, slug: "a", name: "A", variantName: "", image: null, unitPrice: 1000, maxStock: 3, categoryName: "Gloss" };
  it("ajoute, cumule et plafonne au stock", () => {
    const { add } = useCart.getState();
    expect(add(item, 2)).toBe("added");
    expect(add(item, 5)).toBe("limit");
    expect(useCart.getState().items[0].quantity).toBe(3);
    expect(cartSubtotal(useCart.getState().items)).toBe(3000);
  });
  it("modifie et supprime", () => {
    useCart.getState().add(item, 1);
    const key = useCart.getState().items[0].key;
    useCart.getState().setQty(key, 99);
    expect(useCart.getState().items[0].quantity).toBe(3);
    useCart.getState().remove(key);
    expect(useCart.getState().items).toHaveLength(0);
  });
});
