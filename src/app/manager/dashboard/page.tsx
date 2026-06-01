import { ProtectedRoute } from "@/components/auth/protected-route";
import { ReportDashboardPage } from "@/components/reports/report-dashboard-page";

const ManagerDashboardPage = () => {
  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <ReportDashboardPage portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerDashboardPage;
