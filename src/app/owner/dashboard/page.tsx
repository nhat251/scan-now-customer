import { ProtectedRoute } from "@/components/auth/protected-route";
import { ReportDashboardPage } from "@/components/reports/report-dashboard-page";

const OwnerDashboardPage = () => {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <ReportDashboardPage portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerDashboardPage;
