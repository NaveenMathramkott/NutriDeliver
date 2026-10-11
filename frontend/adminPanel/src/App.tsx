import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage";
import { RestaurantsPage } from "@/pages/RestaurantsPage";
import { FoodPage } from "@/pages/FoodPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { OffersPage } from "@/pages/OffersPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { RidersPage } from "@/pages/RidersPage";
import { AdminsPage } from "@/pages/AdminsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { store } from "@/store";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { refreshUser, clearSession } from "@/store/slices/authSlice";
import { setUnauthorizedHandler } from "@/services/api/client";
import { useNavigate } from "react-router-dom";

function AuthInitializer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Re-validate the stored token on boot.
  useEffect(() => {
    dispatch(refreshUser());
  }, [dispatch]);

  // A 401 from any request clears the store and routes to /login through the
  // router, rather than a hard reload.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(clearSession());
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [dispatch, navigate]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <BrowserRouter>
          <AuthInitializer />
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/food" element={<FoodPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/riders" element={<RidersPage />} />
              <Route path="/admins" element={<AdminsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
