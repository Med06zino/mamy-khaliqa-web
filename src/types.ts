export interface Paginated<T> { count: number; next: string | null; previous: string | null; results: T[] }
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

/* ── Bannières ──────────────────────────────────────────────── */
export type BannerType = "hero" | "promo";
export interface Banner {
  id: number;
  banner_type: BannerType;
  title: string;
  subtitle: string;
  image: string | null;
  button_text: string;
  link_url: string;
  position: number;
}
/** Version admin avec champs supplémentaires */
export interface AdminBanner extends Banner {
  is_active: boolean;
  created_at: string;
}

/* ── Catalogue ──────────────────────────────────────────────── */
export interface CategoryRef { id: number; name: string; slug: string }
export interface Category extends CategoryRef {
  description: string;
  image: string | null;
  product_count: number;
}

export interface ProductListItem {
  id: number; name: string; slug: string; sku: string;
  price: number; compare_at_price: number | null;
  volume: string; short_description: string;
  category: CategoryRef; main_image: string | null;
  available_stock: number; stock_status: StockStatus;
  has_variants: boolean; is_featured: boolean;
  created_at: string;
}
export interface Variant { id: number; name: string; sku: string; price: number; stock: number }
export interface ProductImage { id: number; image: string; alt: string; position: number }
export interface ProductDetail extends ProductListItem {
  description: string; ingredients: string; usage_tips: string; precautions: string;
  images: ProductImage[]; variants: Variant[]; related: ProductListItem[];
  rating: { average: number | null; count: number }; user_can_review: boolean;
}

/** Réponse de /products/best-sellers/ — inclut un flag pour adapter le libellé affiché */
export interface BestSellersResponse {
  is_fallback: boolean;      // true = pas de vraies ventes, produits mis en avant ou récents
  results: ProductListItem[];
}
export interface Perk {
  id: number;
  icon: string; // clé : truck, check-circle, message-circle, shield-check, sparkles, heart, gift, clock
  title: string;
  description: string;
}

/* ── Avis ───────────────────────────────────────────────────── */
export interface Review {
  id: number; product_slug: string; rating: number;
  comment: string; author: string; created_at: string;
}

/* ── Comptes ────────────────────────────────────────────────── */
export interface User {
  id: number; email: string; first_name: string;
  last_name: string; phone: string; is_staff: boolean;
}
export interface Address {
  id: number; label: string; recipient_name: string; phone: string;
  line1: string; city: string;
  delivery_zone: number | null; delivery_zone_name?: string; is_default: boolean;
}
export interface DeliveryZone { id: number; name: string; fee: number; info: string }

/* ── Paramètres boutique ────────────────────────────────────── */
export interface StoreSettings {
  name: string; tagline: string; logo: string | null;
  contact_email: string; contact_phone: string; address: string;
  whatsapp_number: string; instagram_url: string;
  facebook_url: string; tiktok_url: string;
  announcement_text: string; announcement_active: boolean;
  footer_text: string; guest_checkout_enabled: boolean;
  payment_cash_on_delivery: boolean; unknown_zone_policy: string;
}

/* ── Commandes ──────────────────────────────────────────────── */
export type OrderStatus =
  | "pending" | "confirmed" | "preparing"
  | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: number; product: number | null; product_slug: string | null;
  product_name: string; product_sku: string;
  variant_name: string; unit_price: number; quantity: number; line_total: number;
}
export interface OrderListItem {
  number: string; status: OrderStatus; status_label: string;
  payment_status: string; payment_status_label: string;
  total: number; created_at: string; items_count: number;
  first_name: string; last_name: string; phone: string;
}
export interface Order extends Omit<OrderListItem, "items_count"> {
  source: string; email: string; address_line: string; city: string;
  delivery_zone_name: string; customer_note: string;
  subtotal: number; delivery_fee: number; delivery_fee_pending: boolean;
  tracking_info: string;
  items: OrderItem[];
  history: { status: OrderStatus; status_label: string; note: string; created_at: string }[];
  allowed_transitions: OrderStatus[];
}

/* ── Dashboard admin ────────────────────────────────────────── */
export interface Dashboard {
  orders_total: number; orders_pending: number;
  orders_in_progress: number; orders_delivered: number;
  revenue_collected: number; products_active: number;
  products_out_of_stock: number; products_low_stock: number;
  top_products: { product_name: string; sold: number }[];
}
