import { DashboardShell } from "@/components/auth/dashboard-shell";

const StaffDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="STAFF"
      description="This placeholder confirms that staff-only protected routing and logout are wired end-to-end."
      title="Staff dashboard"
    >
      <p className="text-muted-foreground text-sm">Staff users are redirected here after login and kept here after session bootstrap.</p>
    </DashboardShell>
  );
};

export default StaffDashboardPage;
