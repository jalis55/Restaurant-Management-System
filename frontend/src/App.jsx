import { Navigate, Route, Routes } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { LoginPage } from "@/pages/login-page";
import { MenuCategoriesPage } from "@/pages/menu-categories-page";
import { MenuItemsPage } from "@/pages/menu-items-page";
import { OperationsOrdersPage } from "@/pages/operations-orders-page";
import { OperationsReservationsPage } from "@/pages/operations-reservations-page";
import { OperationsTablesPage } from "@/pages/operations-tables-page";
import { ReportsRevenuePage } from "@/pages/reports-revenue-page";
import { ReportsStaffPerformancePage } from "@/pages/reports-staff-performance-page";
import { ReportsTopItemsPage } from "@/pages/reports-top-items-page";
import { RoleOverviewPage } from "@/pages/role-overview-page";
import { SettingsProfilePage } from "@/pages/settings-profile-page";
import { SettingsStaffAccountsPage } from "@/pages/settings-staff-accounts-page";
import { StaffActiveOrdersPage } from "@/pages/staff-active-orders-page";
import { StaffKitchenDisplayPage } from "@/pages/staff-kitchen-display-page";
import { StaffNewOrderPage } from "@/pages/staff-new-order-page";
import { StaffTodayReservationsPage } from "@/pages/staff-today-reservations-page";
import { useAuth } from "@/hooks/use-auth";

function RoleHomeRoute() {
  const { user } = useAuth();

  if (user?.role === "admin" || user?.role === "manager") {
    return <RoleOverviewPage user={user} />;
  }

  return <Navigate to={user?.role === "waiter" ? "/staff/orders/new" : "/staff/orders/kitchen"} replace />;
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<RoleHomeRoute />} />
          <Route path="operations/orders" element={<OperationsOrdersPage />} />
          <Route path="operations/orders/new" element={<StaffNewOrderPage />} />
          <Route path="operations/reservations" element={<OperationsReservationsPage />} />
          <Route path="operations/tables" element={<OperationsTablesPage />} />
          <Route path="menu/items" element={<MenuItemsPage />} />
          <Route path="menu/categories" element={<MenuCategoriesPage />} />
          <Route path="reports/revenue" element={<ReportsRevenuePage />} />
          <Route path="reports/top-items" element={<ReportsTopItemsPage />} />
          <Route path="reports/staff-performance" element={<ReportsStaffPerformancePage />} />
          <Route path="settings/staff-accounts" element={<SettingsStaffAccountsPage user={user} />} />
          <Route path="settings/profile" element={<SettingsProfilePage user={user} />} />
          <Route path="staff/orders/new" element={<StaffNewOrderPage />} />
          <Route path="staff/orders/active" element={<StaffActiveOrdersPage />} />
          <Route path="staff/orders/kitchen" element={<StaffKitchenDisplayPage />} />
          <Route path="staff/reservations/today" element={<StaffTodayReservationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
