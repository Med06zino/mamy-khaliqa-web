import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import { Layout } from "./components/layout/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { Spinner } from "./components/ui/States";
import { ToastHost } from "./components/ui/ToastHost";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import OrderConfirmation from "./pages/OrderConfirmation";
import Product from "./pages/Product";
import Shop from "./pages/Shop";
import { About, Contact, Delivery, Faq, Privacy, Returns, Terms } from "./pages/Static";
import { ForgotPassword, Login, Register, ResetPassword } from "./pages/Auth";
import { AccountHome, AccountLayout, Addresses, Favorites, OrderDetail, Orders, Profile, Security } from "./pages/account/Account";
import { useAuth } from "./store/auth";
import { useFavorites } from "./store/favorites";
import { useSettings } from "./store/settings";

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const A = (name: string) => lazy(() => import("./pages/admin/AdminPages").then((m) => ({ default: (m as unknown as Record<string, React.ComponentType>)[name] })));
const AdminDashboard = A("AdminDashboard"), AdminProducts = A("AdminProducts"), AdminOrders = A("AdminOrders"),
  AdminCustomers = A("AdminCustomers"), AdminReviewsMessages = A("AdminReviewsMessages"), AdminSettings = A("AdminSettings");

export default function App() {
  const loadAuth = useAuth((s) => s.load);
  const user = useAuth((s) => s.user);
  const loadSettings = useSettings((s) => s.load);
  useEffect(() => { loadAuth(); loadSettings(); }, [loadAuth, loadSettings]);
  useEffect(() => { if (user) useFavorites.getState().load().catch(() => {}); }, [user]);

  return (
    <>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="boutique" element={<Shop />} />
            <Route path="boutique/categorie/:slug" element={<Shop />} />
            <Route path="boutique/:slug" element={<Product />} />
            <Route path="panier" element={<Cart />} />
            <Route path="commande" element={<Checkout />} />
            <Route path="commande/confirmation/:number" element={<OrderConfirmation />} />
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
