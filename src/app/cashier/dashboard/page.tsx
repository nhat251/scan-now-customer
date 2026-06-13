import { ProtectedRoute } from "@/components/auth/protected-route";
import { CashierDashboardPage } from "@/components/cashier/cashier-dashboard-page";

const CashierDashboardRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["CASHIER"]}>
      <CashierDashboardPage />
    </ProtectedRoute>
  );
};

export default CashierDashboardRoute;
