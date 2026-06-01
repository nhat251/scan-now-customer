import { ProtectedRoute } from "@/components/auth/protected-route";
import { WaiterDashboardPage } from "@/components/waiter/waiter-dashboard-page";

const StaffDashboardRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["STAFF"]}>
      <WaiterDashboardPage />
    </ProtectedRoute>
  );
};

export default StaffDashboardRoute;
