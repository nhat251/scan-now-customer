import { DashboardShell } from "@/components/auth/dashboard-shell";

const KitchenDashboardPage = () => {
  return (
    <DashboardShell
      allowedRole="KITCHEN"
      description="Trang này xác nhận luồng bảo vệ dành riêng cho nhân viên bếp và chức năng đăng xuất đã hoạt động."
      title="Bảng điều khiển bếp"
    >
      <p className="text-muted-foreground text-sm">
        Nhân viên bếp được chuyển đến đây sau khi đăng nhập và khôi phục phiên.
      </p>
    </DashboardShell>
  );
};

export default KitchenDashboardPage;
