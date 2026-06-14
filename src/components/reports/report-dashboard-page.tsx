"use client";

import {
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  ReceiptText,
  RefreshCw,
  Store,
  Target,
  Trophy,
} from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import {
  formatCurrency,
  getManageMenuNavItems,
  getPortalCopy,
  type ManagePortal,
} from "@/components/manage-menu/helpers";
import { formatReportPercent } from "@/components/reports/report-chart.helpers";
import { ReportChartPanel } from "@/components/reports/report-chart-panel";
import { ReportDateField } from "@/components/reports/report-date-field";
import { ReportInsightCard } from "@/components/reports/report-insight-card";
import { ReportMetricBarChart } from "@/components/reports/report-metric-bar-chart";
import { ReportOrderStatusSummary } from "@/components/reports/report-order-status-summary";
import { ReportPaymentMethodChart } from "@/components/reports/report-payment-method-chart";
import { ReportPeakHourLineChart } from "@/components/reports/report-peak-hour-line-chart";
import { ReportPeriodButton } from "@/components/reports/report-period-button";
import { ReportRankedList } from "@/components/reports/report-ranked-list";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getPaymentMethodLabel } from "@/helpers/presentation";
import { useReportDashboard } from "@/hooks/reports/use-report-dashboard";
import { cn } from "@/lib/utils";

type ReportDashboardPageProps = {
  portal: ManagePortal;
};

export const ReportDashboardPage = ({ portal }: ReportDashboardPageProps) => {
  const copy = getPortalCopy(portal);
  const {
    branchId,
    branches,
    currentUser,
    exportRevenueReport,
    metrics: {
      completionRate,
      pendingOrders,
      paidRevenueRate,
      bestRevenueDay,
      busiestHour,
    },
    periodPreset,
    refetchReport,
    register,
    report,
    reportQuery,
    revenueSeries,
    setPreset,
    setValue,
  } = useReportDashboard(portal);

  return (
    <PortalShell
      title={portal === "owner" ? "Báo cáo chủ quán" : "Báo cáo quản lý"}
      description="Theo dõi doanh thu, số đơn, giờ cao điểm và hiệu quả chi nhánh theo giờ Việt Nam."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "dashboard", branchId || undefined)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard
            label="Tổng doanh thu"
            value={formatCurrency(report?.paidRevenue ?? 0)}
            helper="Thanh toán thành công"
          />
          <PortalStatCard
            label="Tổng đơn"
            value={String(report?.totalOrders ?? 0)}
            helper={`${report?.completedOrders ?? 0} đơn hoàn tất`}
          />
          <PortalStatCard
            label="Trung bình/đơn"
            value={formatCurrency(report?.averageOrderValue ?? 0)}
            helper="Không tính đơn đã hủy"
          />
          <PortalStatCard
            label="Hoàn tất"
            value={formatReportPercent(completionRate)}
            helper={`${pendingOrders} đơn chưa hoàn tất`}
          />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-3 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[auto_1fr_auto] xl:items-end">
          <div>
            <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-bold uppercase">
              <CalendarRange className="size-3.5" />
              Khoảng thời gian
            </p>
            <div className="bg-muted/50 grid grid-cols-5 gap-1 rounded-lg p-1">
              <ReportPeriodButton
                active={periodPreset === "today"}
                onClick={() => setPreset("today")}
              >
                Ngày
              </ReportPeriodButton>
              <ReportPeriodButton
                active={periodPreset === "week"}
                onClick={() => setPreset("week")}
              >
                Tuần
              </ReportPeriodButton>
              <ReportPeriodButton
                active={periodPreset === "month"}
                onClick={() => setPreset("month")}
              >
                Tháng
              </ReportPeriodButton>
              <ReportPeriodButton
                active={periodPreset === "quarter"}
                onClick={() => setPreset("quarter")}
              >
                Quý
              </ReportPeriodButton>
              <ReportPeriodButton
                active={periodPreset === "year"}
                onClick={() => setPreset("year")}
              >
                Năm
              </ReportPeriodButton>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            <label className="text-sm font-semibold">
              Chi nhánh
              <select
                {...register("branchId")}
                className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <ReportDateField
              label="Từ ngày"
              {...register("fromDate", {
                onChange: () => setValue("periodPreset", "custom"),
              })}
            />
            <ReportDateField
              label="Đến ngày"
              {...register("toDate", {
                onChange: () => setValue("periodPreset", "custom"),
              })}
            />
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button
              className="h-10"
              variant="soft"
              onClick={exportRevenueReport}
              disabled={!report || !revenueSeries}
            >
              <Download className="size-4" />
              Xuất Excel
            </Button>
            <Button
              className="h-10"
              variant="soft"
              onClick={() => refetchReport()}
              disabled={reportQuery.isFetching}
            >
              <RefreshCw className={cn("size-4", reportQuery.isFetching && "animate-spin")} />
              Làm mới
            </Button>
          </div>
        </div>
      </section>

      {reportQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải báo cáo...</span>
        </div>
      ) : null}

      {reportQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          Không tải được báo cáo cho tài khoản này.
        </div>
      ) : null}

      {report && revenueSeries ? (
        <div className="space-y-3">
          <section className="grid min-w-0 gap-3 xl:grid-cols-2">
            <ReportChartPanel
              title="Biểu đồ doanh thu"
              icon={<BarChart3 className="size-4" />}
              subtitle={revenueSeries.subtitle}
            >
              <ReportMetricBarChart
                color="#2563eb"
                data={revenueSeries.points.map((point) => ({
                  label: point.label,
                  value: point.revenue,
                  detail: `Tổng doanh thu: ${formatCurrency(point.revenue)} | Số đơn: ${point.orders}`,
                }))}
                formatValue={formatCurrency}
              />
            </ReportChartPanel>
            <ReportChartPanel
              title="Số đơn"
              icon={<ReceiptText className="size-4" />}
              subtitle={revenueSeries.subtitle}
            >
              <ReportMetricBarChart
                color="#d97706"
                data={revenueSeries.points.map((point) => ({
                  label: point.label,
                  value: point.orders,
                  detail: `Số đơn: ${point.orders} | Tổng doanh thu: ${formatCurrency(point.revenue)}`,
                }))}
                formatValue={(value) => `${value} đơn`}
              />
            </ReportChartPanel>
          </section>

          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.1fr)]">
            <ReportChartPanel
              title="Phương thức thanh toán"
              icon={<CreditCard className="size-4" />}
            >
              <ReportPaymentMethodChart
                items={(report.paymentMethods ?? []).map((item) => ({
                  id: item.method,
                  label: getPaymentMethodLabel(item.method),
                  helper: `${item.count} giao dịch`,
                  value: formatCurrency(item.amount),
                  score: item.amount,
                }))}
              />
            </ReportChartPanel>
            <ReportChartPanel title="Tình trạng đơn" icon={<ReceiptText className="size-4" />}>
              <ReportOrderStatusSummary
                completionRate={completionRate}
                pendingOrders={pendingOrders}
                completedOrders={report.completedOrders}
              />
            </ReportChartPanel>
            <ReportChartPanel
              title="Giờ cao điểm"
              icon={<Clock3 className="size-4" />}
              subtitle="Đường biểu diễn số đơn theo giờ"
            >
              <ReportPeakHourLineChart
                data={report.peakHours.map((point) => ({
                  label: point.label,
                  value: point.orders,
                  revenue: point.revenue,
                }))}
              />
            </ReportChartPanel>
          </section>

          <section className="grid min-w-0 gap-3 lg:grid-cols-3">
            <ReportInsightCard
              label="Ngày tốt nhất"
              value={bestRevenueDay?.label ?? "-"}
              helper={bestRevenueDay ? formatCurrency(bestRevenueDay.revenue) : "Chưa có dữ liệu"}
              icon={<Target className="size-4" />}
              color="#2563eb"
            />
            <ReportInsightCard
              label="Giờ đông nhất"
              value={busiestHour?.label ?? "-"}
              helper={busiestHour ? `${busiestHour.orders} đơn` : "Chưa có dữ liệu"}
              icon={<Clock3 className="size-4" />}
              color="#d97706"
            />
            <ReportInsightCard
              label="Đã thu"
              value={formatReportPercent(paidRevenueRate)}
              helper={formatCurrency(report.paidRevenue)}
              icon={<CircleDollarSign className="size-4" />}
              color="#059669"
            />
          </section>

          <section className="grid min-w-0 gap-3 xl:grid-cols-2">
            <ReportChartPanel title="So sánh chi nhánh" icon={<Store className="size-4" />}>
              <ReportRankedList
                emptyText="Chưa có dữ liệu chi nhánh."
                items={report.branches.map((branch) => ({
                  id: branch.branchId,
                  label: branch.branchName,
                  helper: `${branch.orders} đơn`,
                  value: formatCurrency(branch.revenue),
                  score: branch.revenue,
                }))}
              />
            </ReportChartPanel>
            <ReportChartPanel title="Món bán chạy" icon={<Trophy className="size-4" />}>
              <ReportRankedList
                compact
                emptyText="Chưa có món bán ra trong khoảng thời gian này."
                items={report.topItems.map((item) => ({
                  id: item.menuItemId,
                  label: item.name,
                  helper: `${item.quantity} lượt bán`,
                  value: formatCurrency(item.revenue),
                  score: item.quantity,
                }))}
              />
            </ReportChartPanel>
          </section>
        </div>
      ) : null}
    </PortalShell>
  );
};
