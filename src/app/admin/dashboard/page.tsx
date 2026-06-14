import { DashboardShell } from "@/components/auth/dashboard-shell";

const AdminDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="ADMIN"
      description="Trang này xác nhận luồng bảo vệ dành riêng cho quản trị viên và chức năng đăng xuất đã hoạt động."
      title="Bảng điều khiển quản trị"
    >
      <p className="text-muted-foreground text-sm">
        Quản trị viên được chuyển đến đây sau khi đăng nhập và khôi phục phiên.
      </p>
    </DashboardShell>
  );
};

export default AdminDashboardPage;
