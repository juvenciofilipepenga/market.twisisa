import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { LocaleProvider } from "./i18n/LocaleContext";
import { AuthProvider } from "./auth/AuthContext";
import { CartProvider } from "./cart/CartContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from "./pages/SearchPage";
import { PublicLayout, FocusLayout } from "./components/layout/PublicLayout";
import { RequireAuth } from "./components/auth/RequireAuth";
import { SessionWatcher } from "./components/layout/SessionWatcher";
import { ToastProvider } from "./components/ui/Toast";
import { NotificationsProvider } from "./notifications/NotificationsContext";
import { RequirePermission } from "./components/admin/RequirePermission";
import { CartReconciler } from "./cart/CartReconciler";
import { PageFallback } from "./components/ui/PageFallback";

// Páginas fora do percurso de compra e todo o admin só descarregam quando são abertas.
const OrderPage = lazy(() => import("./pages/OrderPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotificationPage = lazy(() => import("./pages/NotificationPage"));
const LegalPage = lazy(() => import("./pages/legal/LegalPage"));
const SiteMapPage = lazy(() => import("./pages/SiteMapPage"));
const MorePage = lazy(() => import("./pages/MorePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));

const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminTeamPage = lazy(() => import("./pages/admin/AdminTeamPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminInvoicePage = lazy(() => import("./pages/admin/AdminInvoicePage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));

const ChatWidget = lazy(() => import("./components/chat/ChatWidget"));
const AdminChatPage = lazy(() => import("./pages/admin/AdminChatPage"));
const AdminChatAiPage = lazy(() => import("./pages/admin/AdminChatAiPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationsProvider>
            <SessionWatcher />
            <CartReconciler />
            <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/produto/:id" element={<ProductPage />} />
                <Route path="/categoria/:slug" element={<CategoryPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/encomenda/:id" element={<RequireAuth><OrderPage /></RequireAuth>} />
                <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path="/notificacoes" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                <Route path="/notificacoes/:id" element={<RequireAuth><NotificationPage /></RequireAuth>} />
                <Route path="/instalar" element={<InstallPage />} />
                <Route path="/definicoes" element={<SettingsPage />} />
                <Route path="/mais" element={<MorePage />} />
                <Route path="/pedidos" element={<RequireAuth><OrdersPage /></RequireAuth>} />
                <Route path="/convites" element={<RequireAuth><ReferralsPage /></RequireAuth>} />
                <Route path="/pesquisa" element={<SearchPage />} />
                <Route path="/termos" element={<LegalPage doc="terms" />} />
                <Route path="/privacidade" element={<LegalPage doc="privacy" />} />
                <Route path="/cookies" element={<LegalPage doc="cookies" />} />
                <Route path="/mapa-do-site" element={<SiteMapPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route element={<FocusLayout />}>
                <Route path="/entrar" element={<LoginPage />} />
                <Route path="/pagamento/:orderId" element={<RequireAuth><PaymentPage /></RequireAuth>} />
                <Route path="/registar" element={<RegisterPage />} />
                <Route path="/recuperar" element={<ForgotPasswordPage />} />
                <Route path="/redefinir" element={<ResetPasswordPage />} />
              </Route>

              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="produtos" element={<RequirePermission perm="catalog.products"><AdminProductsPage /></RequirePermission>} />
                <Route path="categorias" element={<RequirePermission perm="catalog.categories"><AdminCategoriesPage /></RequirePermission>} />
                <Route path="pedidos" element={<RequirePermission perm="orders.view"><AdminOrdersPage /></RequirePermission>} />
                <Route path="utilizadores" element={<RequirePermission perm="users.view"><AdminUsersPage /></RequirePermission>} />
                <Route path="fatura" element={<RequirePermission perm="finance.settings"><AdminInvoicePage /></RequirePermission>} />
                <Route path="pagamentos" element={<RequirePermission perm="payments.view"><AdminPaymentsPage /></RequirePermission>} />
                <Route path="equipa" element={<RequirePermission perm="team.manage"><AdminTeamPage /></RequirePermission>} />
                <Route
                  path="chat"
                  element={
                    <ErrorBoundary>
                      <RequirePermission perm="support.manage"><Suspense fallback={null}><AdminChatPage /></Suspense></RequirePermission>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="chat/ia"
                  element={
                    <ErrorBoundary>
                      <RequirePermission perm="support.manage"><Suspense fallback={null}><AdminChatAiPage /></Suspense></RequirePermission>
                    </ErrorBoundary>
                  }
                />
              </Route>

            </Routes>
            </Suspense>

            <ErrorBoundary mode="silent">
              <Suspense fallback={null}><ChatWidget /></Suspense>
            </ErrorBoundary>
            </NotificationsProvider>
          </CartProvider>
        </AuthProvider>
        </ToastProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}
