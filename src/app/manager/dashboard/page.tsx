import { DashboardShell } from "@/components/auth/dashboard-shell";

const ManagerDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="BRANCH_MANAGER"
      description="This placeholder confirms that manager-only protected routing and logout are wired end-to-end."
      title="Manager dashboard"
    >
      <p className="text-muted-foreground text-sm">Manager users are redirected here after login and kept here after session bootstrap.</p>
    </DashboardShell>
  );
};

export default ManagerDashboardPage;
