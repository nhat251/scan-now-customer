import type { Row, Worksheet } from "exceljs";

import type { ChartPoint } from "@/components/reports/report-dashboard.types";
import { getPaymentMethodLabel } from "@/helpers/presentation";
import type { OwnerReportResponse } from "@/types/reports";

const MONEY_FORMAT = '#,##0 "₫"';
const BRAND_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFFF6B00" },
};
const HEADER_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FF111827" },
};
const SOFT_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFFFF3E8" },
};
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
    cell.border = {
      top: BORDER_STYLE,
      left: BORDER_STYLE,
      bottom: BORDER_STYLE,
      right: BORDER_STYLE,
    };
  });
};

const styleBodyRows = (sheet: Worksheet, fromRow: number) => {
  for (let rowIndex = fromRow; rowIndex <= sheet.rowCount; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    row.eachCell((cell) => {
      cell.border = {
        top: BORDER_STYLE,
        left: BORDER_STYLE,
        bottom: BORDER_STYLE,
        right: BORDER_STYLE,
      };
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

export const getReportOverviewRows = (
  report: OwnerReportResponse,
  metrics: {
    completionRate: number;
    paidRevenueRate: number;
    pendingOrders: number;
  }
) => [
  ["Doanh thu đã thu", report.paidRevenue, "Thanh toán thành công", metrics.paidRevenueRate / 100],
  ["Doanh thu chưa thu", report.pendingRevenue, "Đơn chưa hoàn tất thanh toán", null],
  ["Tổng doanh thu", report.totalRevenue, "Đã thu + chưa thu", null],
  ["Tổng đơn", report.totalOrders, "Tất cả đơn trong khoảng lọc", null],
  ["Đơn hoàn tất", report.completedOrders, "Đơn đã phục vụ/hoàn tất", metrics.completionRate / 100],
  ["Đơn còn lại", metrics.pendingOrders, "Chưa hoàn tất hoặc chưa thu", null],
  ["Giá trị trung bình/đơn", report.averageOrderValue, "Không tính đơn đã hủy", null],
];

export const getReportPaymentRows = (report: OwnerReportResponse) => {
  const paidRevenue = Math.max(report.paidRevenue, 1);

  return report.paymentMethods.map((item) => [
    getPaymentMethodLabel(item.method),
    item.count,
    item.amount,
    item.amount / paidRevenue,
  ]);
};

export const getReportBranchRows = (report: OwnerReportResponse) =>
  report.branches.map((branch) => [
    branch.branchName,
    branch.orders,
    branch.revenue,
    branch.orders > 0 ? branch.revenue / branch.orders : 0,
  ]);

export const getReportTopItemRows = (report: OwnerReportResponse) =>
  report.topItems.map((item) => [
    item.name,
    item.quantity,
    item.revenue,
    item.quantity > 0 ? item.revenue / item.quantity : 0,
  ]);

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

export const exportRevenueWorkbook = async ({
  report,
  revenueSeries,
  selectedBranch,
  fromDate,
  toDate,
  metrics,
}: {
  report: OwnerReportResponse;
  revenueSeries: { subtitle: string; points: ChartPoint[] };
  selectedBranch: string;
  fromDate: string;
  toDate: string;
  metrics: {
    completionRate: number;
    paidRevenueRate: number;
    pendingOrders: number;
  };
}) => {
  const subtitle = `Chi nhánh: ${selectedBranch} | Từ ${fromDate} đến ${toDate} | Giờ Việt Nam`;
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
  getReportOverviewRows(report, metrics).forEach((row) => overview.addRow(row));
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
  revenueSeries.points.forEach((point) =>
    revenueSheet.addRow([point.label, point.revenue, point.orders])
  );
  revenueSheet.getColumn(2).numFmt = MONEY_FORMAT;
  styleBodyRows(revenueSheet, 5);
  finalizeSheet(revenueSheet);

  const paymentSheet = workbook.addWorksheet("Thanh toán");
  styleTitle(paymentSheet, "Phương thức thanh toán", subtitle);
  paymentSheet.addRow([]);
  styleHeader(
    paymentSheet.addRow(["Phương thức", "Số giao dịch", "Doanh thu", "Tỷ trọng doanh thu"])
  );
  getReportPaymentRows(report).forEach((row) => paymentSheet.addRow(row));
  paymentSheet.getColumn(3).numFmt = MONEY_FORMAT;
  paymentSheet.getColumn(4).numFmt = "0.0%";
  styleBodyRows(paymentSheet, 5);
  finalizeSheet(paymentSheet);

  const branchesSheet = workbook.addWorksheet("Chi nhánh");
  styleTitle(branchesSheet, "So sánh chi nhánh", subtitle);
  branchesSheet.addRow([]);
  styleHeader(
    branchesSheet.addRow(["Chi nhánh", "Số đơn", "Doanh thu", "Doanh thu trung bình/đơn"])
  );
  getReportBranchRows(report).forEach((row) => branchesSheet.addRow(row));
  branchesSheet.getColumn(3).numFmt = MONEY_FORMAT;
  branchesSheet.getColumn(4).numFmt = MONEY_FORMAT;
  styleBodyRows(branchesSheet, 5);
  finalizeSheet(branchesSheet);

  const itemsSheet = workbook.addWorksheet("Món bán chạy");
  styleTitle(itemsSheet, "Món bán chạy", subtitle);
  itemsSheet.addRow([]);
  styleHeader(itemsSheet.addRow(["Món", "Số lượng", "Doanh thu", "Doanh thu trung bình/món"]));
  getReportTopItemRows(report).forEach((row) => itemsSheet.addRow(row));
  itemsSheet.getColumn(3).numFmt = MONEY_FORMAT;
  itemsSheet.getColumn(4).numFmt = MONEY_FORMAT;
  styleBodyRows(itemsSheet, 5);
  finalizeSheet(itemsSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    `scannow-bao-cao-doanh-thu-${fromDate}_${toDate}.xlsx`,
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );
};
