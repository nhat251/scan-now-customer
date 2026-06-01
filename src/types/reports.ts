export type ReportQuery = {
  branchId?: string;
  fromDate?: string;
  toDate?: string;
};

export type ReportPointResponse = {
  label: string;
  date: string | null;
  revenue: number;
  orders: number;
};

export type TopItemReportResponse = {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type BranchReportResponse = {
  branchId: string;
  branchName: string;
  revenue: number;
  orders: number;
};

export type OwnerReportResponse = {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  revenueByDay: ReportPointResponse[];
  peakHours: ReportPointResponse[];
  topItems: TopItemReportResponse[];
  branches: BranchReportResponse[];
};
