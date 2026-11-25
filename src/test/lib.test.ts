import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, errorMessage, get, post, setUnauthorizedHandler } from "../lib/api";
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

describe("api", () => {
  const jsonResponse = (status: number, data: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => key.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: async () => data,
  }) as Response;

  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
    document.cookie = "csrftoken=; max-age=0";
  });

  it("envoie le jeton CSRF renvoyé par /auth/csrf/ sur les mutations", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { csrfToken: "token-123" }))
      .mockResolvedValueOnce(jsonResponse(201, { id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await post("/favorites/", { product_id: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect(new Headers(init.headers).get("X-CSRFToken")).toBe("token-123");
  });

  it("invalide la session sur un 403 d'authentification", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse(403, { detail: "Informations d'authentification non fournies.", errors: {} }),
    ));

    await expect(get("/favorites/")).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledWith("/favorites/");
  });

  it("affiche un message réseau explicite et suspend les appels suivants", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const error = await get("/settings/").catch((e) => e);
    expect(errorMessage(error)).toContain("Impossible de joindre le serveur");
    await expect(get("/settings/")).rejects.toMatchObject({ status: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
