import { create } from "zustand";

import { get } from "../lib/api";
import type { StoreSettings } from "../types";

const DEFAULTS: StoreSettings = {
  name: "Mamy Khaliqa", tagline: "Révélez votre beauté, sublimez votre quotidien.", logo: null, contact_email: "",
  contact_phone: "", address: "", whatsapp_number: "", instagram_url: "", facebook_url: "", tiktok_url: "",
  announcement_text: "", announcement_active: false, footer_text: "", guest_checkout_enabled: true,
  payment_cash_on_delivery: false, unknown_zone_policy: "",
};
interface S { settings: StoreSettings; loaded: boolean; load: () => Promise<void> }
export const useSettings = create<S>((set) => ({
  settings: DEFAULTS,
  loaded: false,
  load: async () => {
    try { set({ settings: await get<StoreSettings>("/settings/"), loaded: true }); } catch { set({ loaded: true }); }
  },
}));
