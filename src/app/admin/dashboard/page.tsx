import { DashboardShell } from "@/components/auth/dashboard-shell";

const AdminDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="ADMIN"
      description="This placeholder confirms that admin-only protected routing and logout are wired end-to-end."
      title="Admin dashboard"
    >
      <p className="text-muted-foreground text-sm">Admin users are redirected here after login and kept here after session bootstrap.</p>
    </DashboardShell>
  );
};

export default AdminDashboardPage;
