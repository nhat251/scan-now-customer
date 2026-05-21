import { DashboardShell } from "@/components/auth/dashboard-shell";

const OwnerDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="OWNER"
      description="This placeholder confirms that owner-only protected routing and logout are wired end-to-end."
      title="Owner dashboard"
    >
      <p className="text-muted-foreground text-sm">Owner users are redirected here after login and kept here after session bootstrap.</p>
    </DashboardShell>
  );
};

export default OwnerDashboardPage;
