import { getCashierPaymentMeta } from "@/components/cashier/cashier-dashboard.helpers";
import { CashierMetricCard } from "@/components/cashier/cashier-metric-card";
import { CashierMixRow } from "@/components/cashier/cashier-mix-row";
import { CashierPill } from "@/components/cashier/cashier-pill";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { Spinner } from "@/components/ui/spinner";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierReportPanel({
  orders,
  isLoading,
  revenue,
  pendingRevenue,
  paidCount,
  averageTicket,
}: {
  orders: OwnerTableOrderHistoryResponse[];
  isLoading: boolean;
  revenue: number;
  pendingRevenue: number;
  paidCount: number;
  averageTicket: number;
}) {
  const payOsCount = orders.filter(
    (order) => order.paymentMethod === "PAYOS" && order.paymentStatus === "SUCCESS"
  ).length;
  const cashCount = orders.filter(
    (order) => order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS"
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CashierMetricCard
          label="Đã thu"
          value={formatCurrency(revenue)}
          helper="Tổng đơn thành công"
        />
        <CashierMetricCard
          label="Đang chờ"
          value={formatCurrency(pendingRevenue)}
          helper="Đơn chưa thu xong"
        />
        <CashierMetricCard
          label="Đơn đã thu"
          value={String(paidCount)}
          helper="Tổng giao dịch đã thu"
        />
        <CashierMetricCard
          label="Trung bình/đơn"
          value={formatCurrency(averageTicket)}
          helper="Giá trị trung bình"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CashierSectionCard className="overflow-hidden">
          <div className="border-b border-[#e8e4dc] px-5 py-4">
            <p className="text-xl font-black">Hoạt động gần đây</p>
            <p className="mt-1 text-sm text-stone-500">100 đơn gần nhất theo chi nhánh hiện tại.</p>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center gap-3 p-5 text-sm">
                <Spinner className="size-5 text-blue-600" />
                <span>Đang tải báo cáo...</span>
              </div>
            ) : null}

            {!isLoading ? (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-bold tracking-[0.18em] text-stone-500 uppercase">
                  <tr>
                    <th className="px-5 py-4">Đơn</th>
                    <th className="px-5 py-4">Bàn</th>
                    <th className="px-5 py-4">Thanh toán</th>
                    <th className="px-5 py-4 text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId} className="border-t border-[#efeae3]">
                      <td className="px-5 py-4">
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4">{order.tableNumber ?? "-"}</td>
                      <td className="px-5 py-4">
                        <CashierPill
                          label={getCashierPaymentMeta(order).label}
                          className={getCashierPaymentMeta(order).className}
                        />
                      </td>
                      <td className="px-5 py-4 text-right font-black">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </CashierSectionCard>

        <CashierSectionCard className="p-5">
          <p className="text-xl font-black">Cơ cấu thanh toán</p>
          <div className="mt-5 space-y-4">
            <CashierMixRow
              label="Tiền mặt"
              value={cashCount}
              total={paidCount}
              className="bg-blue-500"
            />
            <CashierMixRow
              label="PayOS"
              value={payOsCount}
              total={paidCount}
              className="bg-orange-500"
            />
          </div>
        </CashierSectionCard>
      </div>
    </div>
  );
}
