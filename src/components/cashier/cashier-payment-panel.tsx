import { CreditCard, Loader2, Printer, Wallet } from "lucide-react";

import { getCashierPaymentMeta } from "@/components/cashier/cashier-dashboard.helpers";
import { CashierEmptyState } from "@/components/cashier/cashier-empty-state";
import { CashierPill } from "@/components/cashier/cashier-pill";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { CashierSummaryRow } from "@/components/cashier/cashier-summary-row";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { PayOsQrPanel } from "@/components/payment/payos-qr-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CashierPaymentResponse } from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierPaymentPanel({
  order,
  voucherCode,
  onVoucherChange,
  activePayOsPayment,
  hasPendingPayOs,
  isCheckingOut,
  isCanceling,
  onCash,
  onPayOs,
  onCancelPayOs,
  onPrint,
}: {
  order: OwnerTableOrderHistoryResponse | null;
  voucherCode: string;
  onVoucherChange: (value: string) => void;
  activePayOsPayment: CashierPaymentResponse | null;
  hasPendingPayOs: boolean;
  isCheckingOut: boolean;
  isCanceling: boolean;
  onCash: () => void;
  onPayOs: () => void;
  onCancelPayOs: () => void;
  onPrint: () => void;
}) {
  if (!order) {
    return (
      <CashierSectionCard>
        <CashierEmptyState
          title="Chưa có thanh toán"
          detail="Chọn đơn để xử lý tiền mặt hoặc PayOS."
        />
      </CashierSectionCard>
    );
  }

  const paymentMeta = getCashierPaymentMeta(order);

  return (
    <CashierSectionCard className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] px-5 py-4">
        <p className="text-xl font-black">Thanh toán</p>
        <p className="mt-1 text-sm text-stone-500">
          {order.orderNumber} · Bàn {order.tableNumber ?? "-"}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="rounded-2xl border border-[#e8e4dc] bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-500">Trạng thái thanh toán</span>
            <CashierPill label={paymentMeta.label} className={paymentMeta.className} />
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-stone-500 uppercase">
                Tổng thu
              </p>
              <p className="mt-1 text-3xl font-black text-orange-600">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
            <Button type="button" variant="soft" className="rounded-xl" onClick={onPrint}>
              <Printer className="size-4" />
              In hóa đơn
            </Button>
          </div>
        </div>

        {order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS" ? (
          <div className="rounded-2xl border border-[#e8e4dc] bg-white p-4 text-sm">
            <CashierSummaryRow
              label="Tiền khách đưa"
              value={formatCurrency(order.amountReceived ?? order.totalAmount)}
            />
            <CashierSummaryRow label="Tiền thừa" value={formatCurrency(order.changeAmount ?? 0)} />
          </div>
        ) : null}

        {order.paymentStatus !== "SUCCESS" ? (
          <div className="space-y-3">
            <Input
              value={voucherCode}
              onChange={(event) => onVoucherChange(event.target.value)}
              placeholder="Mã voucher (không bắt buộc)"
              className="h-11 rounded-xl border-[#e8e4dc]"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onCash}
                disabled={isCheckingOut || hasPendingPayOs}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wallet className="size-4" />
                Tiền mặt
              </button>
              <button
                type="button"
                onClick={onPayOs}
                disabled={isCheckingOut}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white px-4 text-sm font-bold text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CreditCard className="size-4" />
                )}
                {hasPendingPayOs ? "Hiện QR PayOS" : "PayOS"}
              </button>
            </div>
            {hasPendingPayOs ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Đơn này đang có thanh toán PayOS chờ xử lý. Muốn đổi sang tiền mặt thì hủy QR trước.
              </div>
            ) : null}
          </div>
        ) : null}

        {activePayOsPayment ? (
          <PayOsQrPanel
            qrCode={activePayOsPayment.qrCode}
            checkoutUrl={activePayOsPayment.checkoutUrl}
            amount={activePayOsPayment.amount ?? order.totalAmount}
            description={activePayOsPayment.description}
            accountName={activePayOsPayment.accountName}
            accountNumber={activePayOsPayment.accountNumber}
            bin={activePayOsPayment.bin}
            expiresAt={activePayOsPayment.paymentExpiresAt}
            onCancel={onCancelPayOs}
            cancelDisabled={isCanceling}
          />
        ) : null}
      </div>
    </CashierSectionCard>
  );
}
