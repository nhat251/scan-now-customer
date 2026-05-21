import { DashboardShell } from "@/components/auth/dashboard-shell";

const KitchenDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="KITCHEN"
      description="This placeholder confirms that kitchen-only protected routing and logout are wired end-to-end."
      title="Kitchen dashboard"
    >
      <p className="text-muted-foreground text-sm">Kitchen users are redirected here after login and kept here after session bootstrap.</p>
    </DashboardShell>
  );
};

export default KitchenDashboardPage;
