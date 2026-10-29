import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { Layout } from "./components/layout/Layout";
import { PageLoader } from "./components/PageLoader";
import { RequireAuth } from "./components/RequireAuth";
import { Spinner } from "./components/ui/States";
import { ToastHost } from "./components/ui/ToastHost";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import Product from "./pages/Product";
import Shop from "./pages/Shop";
import Promotions from "./pages/Promotions";
import { About, Contact, Delivery, Faq, Privacy, Returns, Terms } from "./pages/Static";
import { ForgotPassword, Login, Register, ResetPassword } from "./pages/Auth";
import {
  AccountHome, AccountLayout, Addresses, Favorites,
  OrderDetail, Orders, Profile, Security,
} from "./pages/account/Account";
import { useAuth } from "./store/auth";
import { useFavorites } from "./store/favorites";
import { useLoader } from "./store/loader";
import { useSettings } from "./store/settings";

const AdminLayout = lazy(() =>
  import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const A = (name: string) =>
  lazy(() =>
    import("./pages/admin/AdminPages").then((m) => ({
      default: (m as unknown as Record<string, React.ComponentType>)[name],
    })),
  );
const AdminDashboard    = A("AdminDashboard");
const AdminProducts     = A("AdminProducts");
const AdminOrders       = A("AdminOrders");
const AdminCustomers    = A("AdminCustomers");
const AdminReviewsMessages = A("AdminReviewsMessages");
const AdminSettings     = A("AdminSettings");

/* ── Masque le loader HTML natif (index.html) ──────────────── */
function dismissHtmlLoader() {
  const el = document.getElementById("mk-loader");
  if (!el) return;
  el.classList.add("hidden");
  // Nettoyage après la transition CSS (450 ms)
  setTimeout(() => el.remove(), 500);
}

/* ── Composant interne qui surveille les navigations ──────── */
function NavigationLoader() {
  const location = useLocation();
  const { show, hide } = useLoader();

  useEffect(() => {
    show();
    // Le temps minimum garantit que l'animation reste visible
    const t = setTimeout(() => hide(), 350);
    return () => { clearTimeout(t); hide(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}

/* ═══════════════════════════════════════════════════════════ */
export default function App() {
  const loadAuth     = useAuth((s) => s.load);
  const user         = useAuth((s) => s.user);
  const authReady    = useAuth((s) => s.ready);
  const loadSettings = useSettings((s) => s.load);
  const settingsLoaded = useSettings((s) => s.loaded);
  const { show, hide, forceHide } = useLoader();

  /* ── Chargement initial : auth + settings ─────────────── */
  useEffect(() => {
    show();
    Promise.all([loadAuth(), loadSettings()]).finally(() => {
      hide();
      dismissHtmlLoader();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sécurité : si auth et settings sont déjà en cache, forcer
     la disparition du loader HTML après 100 ms au maximum.   */
  useEffect(() => {
    if (authReady && settingsLoaded) {
      forceHide();
      dismissHtmlLoader();
    }
  }, [authReady, settingsLoaded, forceHide]);

  /* ── Favoris utilisateur ──────────────────────────────── */
  useEffect(() => {
    if (user) useFavorites.getState().load().catch(() => {});
  }, [user]);

  return (
    <>
      {/* Loader React (navigations, actions) */}
      <PageLoader />

      <Suspense fallback={<Spinner />}>
        <NavigationLoader />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="boutique" element={<Shop />} />
            <Route path="boutique/categorie/:slug" element={<Shop />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="boutique/:slug" element={<Product />} />
            <Route path="panier" element={<Cart />} />
            <Route path="commande" element={<Checkout />} />
            <Route path="commande/confirmation/:number" element={<OrderConfirmation />} />
            <Route path="commande/paiement/succes/:number" element={<PaymentSuccess />} />
            <Route path="a-propos" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<Faq />} />
            <Route path="livraison" element={<Delivery />} />
            <Route path="retours" element={<Returns />} />
            <Route path="conditions-generales" element={<Terms />} />
            <Route path="confidentialite" element={<Privacy />} />
            <Route path="connexion" element={<Login />} />
            <Route path="inscription" element={<Register />} />
            <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
            <Route path="reinitialiser-mot-de-passe" element={<ResetPassword />} />
            <Route element={<RequireAuth />}>
              <Route path="compte" element={<AccountLayout />}>
                <Route index element={<AccountHome />} />
                <Route path="profil" element={<Profile />} />
                <Route path="adresses" element={<Addresses />} />
                <Route path="commandes" element={<Orders />} />
                <Route path="commandes/:number" element={<OrderDetail />} />
                <Route path="favoris" element={<Favorites />} />
                <Route path="securite" element={<Security />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<RequireAuth staff />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="produits" element={<AdminProducts />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="clients" element={<AdminCustomers />} />
              <Route path="avis-messages" element={<AdminReviewsMessages />} />
              <Route path="parametres" element={<AdminSettings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      <ToastHost />
    </>
  );
}
