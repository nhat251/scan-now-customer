"use client";

import { forwardRef, type ReactNode, useMemo, useState } from "react";
import type { Row, Worksheet } from "exceljs";
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
import { useForm, useWatch } from "react-hook-form";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { formatCurrency, getManageMenuNavItems, getPortalCopy, type ManagePortal } from "@/components/manage-menu/helpers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useOwnerBranchListQuery } from "@/hooks/queries/useOwnerBranchListQuery";
import { useReportOverviewQuery } from "@/hooks/queries/useReportQueries";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { ReportPointResponse } from "@/types/reports";
import type { BranchResponse } from "@/types/user-management";

type ReportDashboardPageProps = {
  portal: ManagePortal;
};

type PeriodPreset = "today" | "week" | "month" | "quarter" | "year" | "custom";
type ChartPoint = { label: string; revenue: number; orders: number };
type SingleMetricPoint = { label: string; value: number; detail: string };

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#0891b2", "#be123c"];

const getVietnamDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "1970"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "1"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
  };
};

const toDateInput = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const addDays = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
};

const daysBetween = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${toDate}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((to - from) / DAY_MS) + 1);
};

const getPresetRange = (preset: Exclude<PeriodPreset, "custom">) => {
  const todayParts = getVietnamDateParts();
  const today = toDateInput(todayParts.year, todayParts.month, todayParts.day);
  const todayUtc = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));

  if (preset === "today") return { fromDate: today, toDate: today };

  if (preset === "week") {
    const weekday = todayUtc.getUTCDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const fromDate = addDays(today, mondayOffset);
    return { fromDate, toDate: addDays(fromDate, 6) };
  }

  if (preset === "month") {
    const fromDate = toDateInput(todayParts.year, todayParts.month, 1);
    const lastDay = new Date(Date.UTC(todayParts.year, todayParts.month, 0)).getUTCDate();
    return { fromDate, toDate: toDateInput(todayParts.year, todayParts.month, lastDay) };
  }

  if (preset === "quarter") {
    const quarterStartMonth = Math.floor((todayParts.month - 1) / 3) * 3 + 1;
    const quarterEndMonth = quarterStartMonth + 2;
    const lastDay = new Date(Date.UTC(todayParts.year, quarterEndMonth, 0)).getUTCDate();
    return {
      fromDate: toDateInput(todayParts.year, quarterStartMonth, 1),
      toDate: toDateInput(todayParts.year, quarterEndMonth, lastDay),
    };
  }

  return {
    fromDate: toDateInput(todayParts.year, 1, 1),
    toDate: toDateInput(todayParts.year, 12, 31),
  };
};

const maxOf = (values: number[]) => Math.max(...values, 1);
const formatPercent = (value: number) => `${Math.round(value)}%`;
const formatShortDate = (value: Date) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(value);

const getMonthKey = (dateValue?: string | null, fallbackLabel?: string) => {
  if (dateValue) {
    const date = new Date(dateValue);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  return fallbackLabel ?? "-";
};

const aggregateByMonth = (points: ReportPointResponse[]): ChartPoint[] => {
  const map = new Map<string, ChartPoint>();

  for (const point of points) {
    const key = getMonthKey(point.date, point.label);
    const current = map.get(key) ?? { label: key.slice(5), revenue: 0, orders: 0 };
    current.revenue += point.revenue;
    current.orders += point.orders;
    map.set(key, current);
  }

  return Array.from(map.values());
};

const aggregateByWeek = (points: ReportPointResponse[]): ChartPoint[] => {
  const result: ChartPoint[] = [];

  for (let index = 0; index < points.length; index += 7) {
    const weekPoints = points.slice(index, index + 7);
    const firstDate = weekPoints[0]?.date ? new Date(weekPoints[0].date) : null;
    const lastDate = weekPoints[weekPoints.length - 1]?.date ? new Date(weekPoints[weekPoints.length - 1].date ?? "") : null;
    const label = firstDate && lastDate && !Number.isNaN(firstDate.getTime()) && !Number.isNaN(lastDate.getTime())
      ? `${formatShortDate(firstDate)}-${formatShortDate(lastDate)}`
      : `Tuần ${Math.floor(index / 7) + 1}`;

    result.push({
      label,
      revenue: weekPoints.reduce((sum, point) => sum + point.revenue, 0),
      orders: weekPoints.reduce((sum, point) => sum + point.orders, 0),
    });
  }

  return result;
};

const getRevenueSeries = ({
  preset,
  fromDate,
  toDate,
  revenueByDay,
  peakHours,
}: {
  preset: PeriodPreset;
  fromDate: string;
  toDate: string;
  revenueByDay: ReportPointResponse[];
  peakHours: ReportPointResponse[];
}) => {
  const rangeDays = daysBetween(fromDate, toDate);

  if (preset === "today" || (preset === "custom" && rangeDays <= 1)) {
    return {
      subtitle: "Đang hiển thị theo giờ",
      points: peakHours.map((point) => ({
        label: point.label.slice(0, 2),
        revenue: point.revenue,
        orders: point.orders,
      })),
    };
  }

  if (preset === "quarter") {
    return {
      subtitle: "Đang hiển thị theo tuần trong quý",
      points: aggregateByWeek(revenueByDay),
    };
  }

  if (preset === "year" || (preset === "custom" && rangeDays > 92)) {
    return {
      subtitle: "Đang hiển thị theo tháng",
      points: aggregateByMonth(revenueByDay),
    };
  }

  return {
    subtitle: preset === "week" ? "Đang hiển thị theo ngày trong tuần" : "Đang hiển thị theo ngày",
    points: revenueByDay.map((point) => ({
      label: preset === "week" ? point.label : point.label.split("/")[0] ?? point.label,
      revenue: point.revenue,
      orders: point.orders,
    })),
  };
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: "Tiền mặt",
    PAYOS: "PayOS",
    BANK_TRANSFER: "Chuyển khoản",
    MOMO: "MoMo",
    VNPAY: "VNPay",
  };

  return labels[method] ?? method;
};

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const MONEY_FORMAT = '#,##0 "₫"';
const BRAND_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFF6B00" } };
const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF111827" } };
const SOFT_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFF3E8" } };
const BORDER_STYLE = { style: "thin" as const, color: { argb: "FFE5E7EB" } };

const styleTitle = (sheet: Worksheet, title: string, subtitle: string) => {
  sheet.mergeCells("A1:D1");
  sheet.mergeCells("A2:D2");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = BRAND_FILL;
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getCell("A2").value = subtitle;
  sheet.getCell("A2").font = { italic: true, color: { argb: "FF6B7280" } };
  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 22;
};

const styleHeader = (row: Row) => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
    cell.border = { top: BORDER_STYLE, left: BORDER_STYLE, bottom: BORDER_STYLE, right: BORDER_STYLE };
  });
};

const styleBodyRows = (sheet: Worksheet, fromRow: number) => {
  for (let rowIndex = fromRow; rowIndex <= sheet.rowCount; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    row.eachCell((cell) => {
      cell.border = { top: BORDER_STYLE, left: BORDER_STYLE, bottom: BORDER_STYLE, right: BORDER_STYLE };
      cell.alignment = { vertical: "middle" };
    });
  }
};

const fitColumns = (sheet: Worksheet) => {
  sheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const rawValue = cell.value;
      const text = rawValue == null ? "" : String(rawValue);
      maxLength = Math.max(maxLength, text.length + 2);
    });
    column.width = Math.min(Math.max(maxLength, 12), 36);
  });
};

const finalizeSheet = (sheet: Worksheet, headerRow = 4) => {
  sheet.views = [{ state: "frozen", ySplit: headerRow }];
  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: Math.max(sheet.columnCount, 1) },
  };
  fitColumns(sheet);
};

export const ReportDashboardPage = ({ portal }: ReportDashboardPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const defaultRange = useMemo(() => getPresetRange("month"), []);

  const { register, control, setValue } = useForm({
    defaultValues: {
      periodPreset: "month" as PeriodPreset,
      fromDate: defaultRange.fromDate,
      toDate: defaultRange.toDate,
      branchId: "",
    },
  });

  const periodPresetVal = useWatch({ control, name: "periodPreset" });
  const fromDateVal = useWatch({ control, name: "fromDate" });
  const toDateVal = useWatch({ control, name: "toDate" });
  const branchIdVal = useWatch({ control, name: "branchId" });

  const ownerBranchesQuery = useOwnerBranchListQuery(
    { pageNumber: 1, pageSize: 100, sortBy: "name", sortDirection: "asc" },
    portal === "owner"
  );
  const managerBranchesQuery = useMyBranchesListQuery(portal === "manager");

  const branches: BranchResponse[] = useMemo(() => {
    return portal === "owner" ? ownerBranchesQuery.data?.items ?? [] : managerBranchesQuery.data ?? [];
  }, [managerBranchesQuery.data, ownerBranchesQuery.data?.items, portal]);

  const reportQuery = useReportOverviewQuery(portal, {
    branchId: branchIdVal || undefined,
    fromDate: fromDateVal,
    toDate: toDateVal,
  });

  const report = reportQuery.data;
  const completionRate = report?.totalOrders ? (report.completedOrders / report.totalOrders) * 100 : 0;
  const pendingOrders = Math.max((report?.totalOrders ?? 0) - (report?.completedOrders ?? 0), 0);
  const paidRevenueRate = report?.totalRevenue ? (report.paidRevenue / report.totalRevenue) * 100 : 0;
  const bestRevenueDay = report?.revenueByDay.reduce((best, item) => (item.revenue > best.revenue ? item : best), report.revenueByDay[0]) ?? null;
  const busiestHour = report?.peakHours.reduce((best, item) => (item.orders > best.orders ? item : best), report.peakHours[0]) ?? null;
  const revenueSeries = report ? getRevenueSeries({ preset: periodPresetVal, fromDate: fromDateVal, toDate: toDateVal, revenueByDay: report.revenueByDay, peakHours: report.peakHours }) : null;

  const setPreset = (preset: Exclude<PeriodPreset, "custom">) => {
    const range = getPresetRange(preset);
    setValue("periodPreset", preset);
    setValue("fromDate", range.fromDate);
    setValue("toDate", range.toDate);
  };

  const exportRevenueReport = async () => {
    if (!report || !revenueSeries) return;

    const selectedBranch = branches.find((branch) => branch.branchId === branchIdVal)?.name ?? "Tất cả chi nhánh";
    const subtitle = `Chi nhánh: ${selectedBranch} | Từ ${fromDateVal} đến ${toDateVal} | Giờ Việt Nam`;
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();

    workbook.creator = "ScanNow";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;

    const overview = workbook.addWorksheet("Tổng quan");
    styleTitle(overview, "Báo cáo doanh thu ScanNow", subtitle);
    overview.addRow([]);
    styleHeader(overview.addRow(["Chỉ số", "Giá trị", "Ghi chú", "Tỷ lệ"]));
    [
      ["Doanh thu đã thu", report.paidRevenue, "Thanh toán thành công", paidRevenueRate / 100],
      ["Doanh thu chưa thu", report.pendingRevenue, "Đơn chưa hoàn tất thanh toán", null],
      ["Tổng doanh thu", report.totalRevenue, "Đã thu + chưa thu", null],
      ["Tổng đơn", report.totalOrders, "Tất cả đơn trong khoảng lọc", null],
      ["Đơn hoàn tất", report.completedOrders, "Đơn đã phục vụ/hoàn tất", completionRate / 100],
      ["Đơn còn lại", pendingOrders, "Chưa hoàn tất hoặc chưa thu", null],
      ["Giá trị trung bình/đơn", report.averageOrderValue, "Không tính đơn đã hủy", null],
    ].forEach((row) => overview.addRow(row));
    overview.getColumn(2).numFmt = MONEY_FORMAT;
    overview.getColumn(4).numFmt = "0.0%";
    styleBodyRows(overview, 5);
    for (let rowIndex = 5; rowIndex <= overview.rowCount; rowIndex += 1) {
      overview.getRow(rowIndex).getCell(1).fill = SOFT_FILL;
      overview.getRow(rowIndex).getCell(1).font = { bold: true };
    }
    finalizeSheet(overview);

    const revenueSheet = workbook.addWorksheet("Doanh thu");
    styleTitle(revenueSheet, "Doanh thu và số đơn", revenueSeries.subtitle);
    revenueSheet.addRow([]);
    styleHeader(revenueSheet.addRow(["Mốc thời gian", "Doanh thu", "Số đơn"]));
    revenueSeries.points.forEach((point) => revenueSheet.addRow([point.label, point.revenue, point.orders]));
    revenueSheet.getColumn(2).numFmt = MONEY_FORMAT;
    styleBodyRows(revenueSheet, 5);
    finalizeSheet(revenueSheet);

    const paymentSheet = workbook.addWorksheet("Thanh toán");
    styleTitle(paymentSheet, "Phương thức thanh toán", subtitle);
    paymentSheet.addRow([]);
    styleHeader(paymentSheet.addRow(["Phương thức", "Số giao dịch", "Doanh thu", "Tỷ trọng doanh thu"]));
    const paidRevenue = Math.max(report.paidRevenue, 1);
    (report.paymentMethods ?? []).forEach((item) => {
      paymentSheet.addRow([getPaymentMethodLabel(item.method), item.count, item.amount, item.amount / paidRevenue]);
    });
    paymentSheet.getColumn(3).numFmt = MONEY_FORMAT;
    paymentSheet.getColumn(4).numFmt = "0.0%";
    styleBodyRows(paymentSheet, 5);
    finalizeSheet(paymentSheet);

    const branchesSheet = workbook.addWorksheet("Chi nhánh");
    styleTitle(branchesSheet, "So sánh chi nhánh", subtitle);
    branchesSheet.addRow([]);
    styleHeader(branchesSheet.addRow(["Chi nhánh", "Số đơn", "Doanh thu", "Doanh thu trung bình/đơn"]));
    report.branches.forEach((branch) => {
      branchesSheet.addRow([
        branch.branchName,
        branch.orders,
        branch.revenue,
        branch.orders > 0 ? branch.revenue / branch.orders : 0,
      ]);
    });
    branchesSheet.getColumn(3).numFmt = MONEY_FORMAT;
    branchesSheet.getColumn(4).numFmt = MONEY_FORMAT;
    styleBodyRows(branchesSheet, 5);
    finalizeSheet(branchesSheet);

    const itemsSheet = workbook.addWorksheet("Món bán chạy");
    styleTitle(itemsSheet, "Món bán chạy", subtitle);
    itemsSheet.addRow([]);
    styleHeader(itemsSheet.addRow(["Món", "Số lượng", "Doanh thu", "Doanh thu trung bình/món"]));
    report.topItems.forEach((item) => {
      itemsSheet.addRow([item.name, item.quantity, item.revenue, item.quantity > 0 ? item.revenue / item.quantity : 0]);
    });
    itemsSheet.getColumn(3).numFmt = MONEY_FORMAT;
    itemsSheet.getColumn(4).numFmt = MONEY_FORMAT;
    styleBodyRows(itemsSheet, 5);
    finalizeSheet(itemsSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      `scannow-bao-cao-doanh-thu-${fromDateVal}_${toDateVal}.xlsx`,
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );
  };

  return (
    <PortalShell
      title={portal === "owner" ? "Báo cáo chủ quán" : "Báo cáo quản lý"}
      description="Theo dõi doanh thu, số đơn, giờ cao điểm và hiệu quả chi nhánh theo giờ Việt Nam."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "dashboard", branchIdVal || undefined)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Doanh thu" value={formatCurrency(report?.paidRevenue ?? 0)} helper="Thanh toán thành công" />
          <PortalStatCard label="Tổng đơn" value={String(report?.totalOrders ?? 0)} helper={`${report?.completedOrders ?? 0} đơn hoàn tất`} />
          <PortalStatCard label="Trung bình/đơn" value={formatCurrency(report?.averageOrderValue ?? 0)} helper="Không tính đơn đã hủy" />
          <PortalStatCard label="Hoàn tất" value={formatPercent(completionRate)} helper={`${pendingOrders} đơn chưa hoàn tất`} />
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
              <PeriodButton active={periodPresetVal === "today"} onClick={() => setPreset("today")}>Ngày</PeriodButton>
              <PeriodButton active={periodPresetVal === "week"} onClick={() => setPreset("week")}>Tuần</PeriodButton>
              <PeriodButton active={periodPresetVal === "month"} onClick={() => setPreset("month")}>Tháng</PeriodButton>
              <PeriodButton active={periodPresetVal === "quarter"} onClick={() => setPreset("quarter")}>Quý</PeriodButton>
              <PeriodButton active={periodPresetVal === "year"} onClick={() => setPreset("year")}>Năm</PeriodButton>
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
            <DateField
              label="Từ ngày"
              {...register("fromDate", {
                onChange: () => setValue("periodPreset", "custom"),
              })}
            />
            <DateField
              label="Đến ngày"
              {...register("toDate", {
                onChange: () => setValue("periodPreset", "custom"),
              })}
            />
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button className="h-10" variant="soft" onClick={exportRevenueReport} disabled={!report || !revenueSeries}>
              <Download className="size-4" />
              Xuất Excel
            </Button>
            <Button className="h-10" variant="soft" onClick={() => reportQuery.refetch()} disabled={reportQuery.isFetching}>
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
            <ChartPanel title="Doanh thu" icon={<BarChart3 className="size-4" />} subtitle={revenueSeries.subtitle}>
              <MetricBarChart
                color="#2563eb"
                data={revenueSeries.points.map((point) => ({
                  label: point.label,
                  value: point.revenue,
                  detail: `Doanh thu: ${formatCurrency(point.revenue)} | Số đơn: ${point.orders}`,
                }))}
                formatValue={formatCurrency}
              />
            </ChartPanel>
            <ChartPanel title="Số đơn" icon={<ReceiptText className="size-4" />} subtitle={revenueSeries.subtitle}>
              <MetricBarChart
                color="#d97706"
                data={revenueSeries.points.map((point) => ({
                  label: point.label,
                  value: point.orders,
                  detail: `Số đơn: ${point.orders} | Doanh thu: ${formatCurrency(point.revenue)}`,
                }))}
                formatValue={(value) => `${value} đơn`}
              />
            </ChartPanel>
          </section>

          <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.1fr)]">
            <ChartPanel title="Phương thức thanh toán" icon={<CreditCard className="size-4" />}>
              <PaymentMethodChart
                items={(report.paymentMethods ?? []).map((item) => ({
                  id: item.method,
                  label: getPaymentMethodLabel(item.method),
                  helper: `${item.count} giao dịch`,
                  value: formatCurrency(item.amount),
                  score: item.amount,
                }))}
              />
            </ChartPanel>
            <ChartPanel title="Tình trạng đơn" icon={<ReceiptText className="size-4" />}>
              <OrderStatusSummary completionRate={completionRate} pendingOrders={pendingOrders} completedOrders={report.completedOrders} />
            </ChartPanel>
            <ChartPanel title="Giờ cao điểm" icon={<Clock3 className="size-4" />} subtitle="Đường biểu diễn số đơn theo giờ">
              <PeakHourLineChart data={report.peakHours.map((point) => ({ label: point.label, value: point.orders, revenue: point.revenue }))} />
            </ChartPanel>
          </section>

          <section className="grid min-w-0 gap-3 lg:grid-cols-3">
            <InsightCard label="Ngày tốt nhất" value={bestRevenueDay?.label ?? "-"} helper={bestRevenueDay ? formatCurrency(bestRevenueDay.revenue) : "Chưa có dữ liệu"} icon={<Target className="size-4" />} color="#2563eb" />
            <InsightCard label="Giờ đông nhất" value={busiestHour?.label ?? "-"} helper={busiestHour ? `${busiestHour.orders} đơn` : "Chưa có dữ liệu"} icon={<Clock3 className="size-4" />} color="#d97706" />
            <InsightCard label="Đã thu" value={formatPercent(paidRevenueRate)} helper={formatCurrency(report.paidRevenue)} icon={<CircleDollarSign className="size-4" />} color="#059669" />
          </section>

          <section className="grid min-w-0 gap-3 xl:grid-cols-2">
            <ChartPanel title="So sánh chi nhánh" icon={<Store className="size-4" />}>
              <RankedList
                emptyText="Chưa có dữ liệu chi nhánh."
                items={report.branches.map((branch) => ({
                  id: branch.branchId,
                  label: branch.branchName,
                  helper: `${branch.orders} đơn`,
                  value: formatCurrency(branch.revenue),
                  score: branch.revenue,
                }))}
              />
            </ChartPanel>
            <ChartPanel title="Món bán chạy" icon={<Trophy className="size-4" />}>
              <RankedList
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
            </ChartPanel>
          </section>
        </div>
      ) : null}
    </PortalShell>
  );
};

const DateField = forwardRef<
  HTMLInputElement,
  { label: string } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, className, ...rest }, ref) => (
  <label className="text-sm font-semibold">
    {label}
    <input
      ref={ref}
      type="date"
      className={cn(
        "border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none",
        className
      )}
      {...rest}
    />
  </label>
));
DateField.displayName = "DateField";

const PeriodButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-8 rounded-md px-2 text-xs font-bold transition-colors sm:px-3 sm:text-sm",
      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const ChartPanel = ({ title, icon, subtitle, children }: { title: string; icon: ReactNode; subtitle?: string; children: ReactNode }) => (
  <div className="bg-card border-border/60 min-w-0 rounded-xl border p-3 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-primary shrink-0">{icon}</span>
          <h2 className="truncate text-base font-bold">{title}</h2>
        </div>
        {subtitle ? <p className="text-muted-foreground mt-0.5 truncate text-xs font-semibold">{subtitle}</p> : null}
      </div>
    </div>
    <div className="mt-3 min-w-0">{children}</div>
  </div>
);

const MetricBarChart = ({ data, color, formatValue }: { data: SingleMetricPoint[]; color: string; formatValue: (value: number) => string }) => {
  const max = maxOf(data.map((item) => item.value));

  return (
    <div
      className="grid h-48 min-w-0 items-end gap-1.5"
      style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))` }}
    >
      {data.map((item) => (
        <MetricBar key={item.label} item={item} color={color} max={max} formatValue={formatValue} />
      ))}
    </div>
  );
};

const MetricBar = ({
  item,
  color,
  max,
  formatValue,
}: {
  item: SingleMetricPoint;
  color: string;
  max: number;
  formatValue: (value: number) => string;
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div
      className="relative flex min-w-0 flex-col items-center gap-1.5"
      onMouseEnter={(event) => showTooltip(event.currentTarget)}
      onMouseLeave={() => setTooltipPosition(null)}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={() => setTooltipPosition(null)}
      tabIndex={0}
    >
      <div className="bg-muted/35 flex h-36 w-full items-end rounded-md px-1">
        <div
          className="w-full rounded-t-sm"
          style={{ height: `${Math.max(4, (item.value / max) * 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-muted-foreground w-full truncate text-center text-[10px] leading-tight">{item.label}</span>
      {tooltipPosition ? (
        <FixedTooltip x={tooltipPosition.x} y={tooltipPosition.y}>
          <p className="font-bold">{item.label}</p>
          <p>{formatValue(item.value)}</p>
          <p>{item.detail}</p>
        </FixedTooltip>
      ) : null}
    </div>
  );
};

const PaymentMethodChart = ({ items }: { items: Array<{ id: string; label: string; helper: string; value: string; score: number }> }) => {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Chưa có thanh toán thành công.</p>;
  }

  return <RankedList items={items} emptyText="Chưa có thanh toán thành công." />;
};

const OrderStatusSummary = ({ completionRate, completedOrders, pendingOrders }: { completionRate: number; completedOrders: number; pendingOrders: number }) => (
  <div className="grid gap-3 sm:grid-cols-[108px_1fr] sm:items-center xl:grid-cols-1 2xl:grid-cols-[108px_1fr]">
    <DonutChart value={completionRate} label={formatPercent(completionRate)} caption="Hoàn tất" color="#059669" />
    <div className="space-y-2.5">
      <MetricRow color="#059669" label="Hoàn tất" value={`${completedOrders} đơn`} percent={completionRate} />
      <MetricRow color="#d97706" label="Chờ xử lý" value={`${pendingOrders} đơn`} percent={100 - completionRate} />
    </div>
  </div>
);

const PeakHourLineChart = ({ data }: { data: Array<{ label: string; value: number; revenue: number }> }) => {
  const width = 640;
  const height = 180;
  const paddingX = 28;
  const paddingY = 20;
  const max = maxOf(data.map((item) => item.value));
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const points = data.map((item, index) => {
    const x = paddingX + (index / Math.max(1, data.length - 1)) * plotWidth;
    const y = paddingY + plotHeight - (item.value / max) * plotHeight;
    return { ...item, x, y };
  });
  const path = points.reduce((current, point, index) => `${current}${index === 0 ? "M" : "L"} ${point.x} ${point.y} `, "");
  const areaPath = `${path}L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="relative min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible">
        <defs>
          <linearGradient id="peak-hour-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = paddingY + (plotHeight / 3) * line;
          return <line key={line} x1={paddingX} y1={y} x2={width - paddingX} y2={y} className="stroke-border/70" strokeWidth="1" />;
        })}
        <path d={areaPath} fill="url(#peak-hour-line)" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label} className="group">
            <circle cx={point.x} cy={point.y} r="4.5" fill="#2563eb" stroke="white" strokeWidth="2" />
            <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
              <rect x={Math.min(point.x + 8, width - 168)} y={Math.max(8, point.y - 50)} width="160" height="44" rx="8" fill="#111827" />
              <text x={Math.min(point.x + 18, width - 158)} y={Math.max(27, point.y - 31)} fill="white" className="text-[12px] font-bold">{point.label}</text>
              <text x={Math.min(point.x + 18, width - 158)} y={Math.max(43, point.y - 15)} fill="#d1d5db" className="text-[11px]">{`${point.value} đơn - ${formatCurrency(point.revenue)}`}</text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};

const DonutChart = ({ value, label, caption, color }: { value: number; label: string; caption: string; color: string }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative mx-auto size-28">
      <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
        <circle cx="60" cy="60" r={radius} className="stroke-muted fill-none" strokeWidth="14" />
        <circle cx="60" cy="60" r={radius} className="fill-none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-black">{label}</p>
        <p className="text-muted-foreground text-[11px] font-semibold">{caption}</p>
      </div>
    </div>
  );
};

const MetricRow = ({ color, label, value, percent }: { color: string; label: string; value: string; percent: number }) => (
  <div>
    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground font-semibold">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }} />
    </div>
  </div>
);

const InsightCard = ({ label, value, helper, icon, color }: { label: string; value: string; helper: string; icon: ReactNode; color: string }) => (
  <div className="bg-card border-border/60 min-w-0 rounded-xl border p-3 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground truncate text-xs font-bold uppercase">{label}</p>
      <span className="shrink-0 rounded-md p-1.5 text-white" style={{ backgroundColor: color }}>
        {icon}
      </span>
    </div>
    <p className="mt-2 truncate text-lg font-black">{value}</p>
    <p className="text-muted-foreground truncate text-xs">{helper}</p>
  </div>
);

const RankedList = ({
  items,
  emptyText,
  compact = false,
}: {
  items: Array<{ id: string; label: string; helper: string; value: string; score: number }>;
  emptyText: string;
  compact?: boolean;
}) => {
  const max = maxOf(items.map((item) => item.score));

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <div className={cn("min-w-0 space-y-2 overflow-x-hidden overflow-y-auto pr-1", compact ? "max-h-72" : "max-h-80")}>
      {items.map((item, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];

        return (
          <RankedListRow key={item.id} item={item} index={index} color={color} max={max} />
        );
      })}
    </div>
  );
};

const RankedListRow = ({
  item,
  index,
  color,
  max,
}: {
  item: { id: string; label: string; helper: string; value: string; score: number };
  index: number;
  color: string;
  max: number;
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      className="bg-muted/30 relative min-w-0 rounded-lg px-3 py-2"
      onMouseEnter={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
      }}
      onMouseLeave={() => setTooltipPosition(null)}
      onFocus={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
      }}
      onBlur={() => setTooltipPosition(null)}
      tabIndex={0}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-sm font-bold">{index + 1}. {item.label}</p>
          <p className="text-muted-foreground truncate text-xs">{item.helper}</p>
        </div>
        <span className="max-w-32 text-right text-sm leading-snug font-bold break-words">{item.value}</span>
      </div>
      <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${Math.max(4, (item.score / max) * 100)}%`, backgroundColor: color }} />
      </div>
      {tooltipPosition ? (
        <FixedTooltip x={tooltipPosition.x} y={tooltipPosition.y}>
          <p className="font-bold">{item.label}</p>
          <p>{item.helper}</p>
          <p>{item.value}</p>
        </FixedTooltip>
      ) : null}
    </div>
  );
};

const FixedTooltip = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <div
    className="pointer-events-none fixed z-50 w-max max-w-60 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-2xl ring-1 ring-white/10 [&_*]:text-white"
    style={{ left: x, top: y + 12 }}
  >
    {children}
  </div>
);
