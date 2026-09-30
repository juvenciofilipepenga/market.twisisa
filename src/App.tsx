import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { LocaleProvider } from "./i18n/LocaleContext";
import { AuthProvider } from "./auth/AuthContext";
import { CartProvider } from "./cart/CartContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import OrderPage from "./pages/OrderPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFoundPage from "./pages/NotFoundPage";
import LegalPage from "./pages/legal/LegalPage";
import { PublicLayout, FocusLayout } from "./components/layout/PublicLayout";
import { SessionWatcher } from "./components/layout/SessionWatcher";
import { ToastProvider } from "./components/ui/Toast";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";

const ChatWidget = lazy(() => import("./components/chat/ChatWidget"));
const AdminChatPage = lazy(() => import("./pages/admin/AdminChatPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <SessionWatcher />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/produto/:id" element={<ProductPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/encomenda/:id" element={<OrderPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/notificacoes" element={<NotificationsPage />} />
                <Route path="/termos" element={<LegalPage doc="terms" />} />
                <Route path="/privacidade" element={<LegalPage doc="privacy" />} />
                <Route path="/cookies" element={<LegalPage doc="cookies" />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route element={<FocusLayout />}>
                <Route path="/entrar" element={<LoginPage />} />
                <Route path="/registar" element={<RegisterPage />} />
              </Route>

              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="produtos" element={<AdminProductsPage />} />
                <Route path="categorias" element={<AdminCategoriesPage />} />
                <Route path="pedidos" element={<AdminOrdersPage />} />
                <Route path="utilizadores" element={<AdminUsersPage />} />
                <Route
                  path="chat"
                  element={
                    <ErrorBoundary>
                      <Suspense fallback={null}><AdminChatPage /></Suspense>
                    </ErrorBoundary>
                  }
                />
              </Route>

            </Routes>

            <ErrorBoundary mode="silent">
              <Suspense fallback={null}><ChatWidget /></Suspense>
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
        </ToastProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}
