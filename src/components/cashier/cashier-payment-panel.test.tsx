import { describe, expect, it, vi } from "vitest";

import { CashierPaymentPanel } from "@/components/cashier/cashier-payment-panel";
import { createOrder } from "@/test/fixtures";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("CashierPaymentPanel", () => {
  it("renders the empty state when no order is selected", () => {
    render(
      <CashierPaymentPanel
        order={null}
        voucherCode=""
        onVoucherChange={vi.fn()}
        activePayOsPayment={null}
        hasPendingPayOs={false}
        isCheckingOut={false}
        isCanceling={false}
        onCash={vi.fn()}
        onPayOs={vi.fn()}
        onCancelPayOs={vi.fn()}
        onPrint={vi.fn()}
      />
    );

    expect(screen.getByText("Chưa có thanh toán")).toBeInTheDocument();
  });

  it("keeps voucher and payment callbacks connected", async () => {
    const user = userEvent.setup();
    const onVoucherChange = vi.fn();
    const onCash = vi.fn();
    const onPayOs = vi.fn();
    const onPrint = vi.fn();

    render(
      <CashierPaymentPanel
        order={createOrder()}
        voucherCode=""
        onVoucherChange={onVoucherChange}
        activePayOsPayment={null}
        hasPendingPayOs={false}
        isCheckingOut={false}
        isCanceling={false}
        onCash={onCash}
        onPayOs={onPayOs}
        onCancelPayOs={vi.fn()}
        onPrint={onPrint}
      />
    );

    await user.type(screen.getByPlaceholderText("Mã voucher (không bắt buộc)"), "S");
    await user.click(screen.getByRole("button", { name: "Tiền mặt" }));
    await user.click(screen.getByRole("button", { name: "PayOS" }));
    await user.click(screen.getByRole("button", { name: "In hóa đơn" }));

    expect(onVoucherChange).toHaveBeenCalled();
    expect(onVoucherChange).toHaveBeenLastCalledWith("S");
    expect(onCash).toHaveBeenCalledOnce();
    expect(onPayOs).toHaveBeenCalledOnce();
    expect(onPrint).toHaveBeenCalledOnce();
  });

  it("disables cash while a PayOS payment is pending", () => {
    render(
      <CashierPaymentPanel
        order={createOrder({ paymentMethod: "PAYOS", paymentStatus: "PENDING" })}
        voucherCode=""
        onVoucherChange={vi.fn()}
        activePayOsPayment={null}
        hasPendingPayOs
        isCheckingOut={false}
        isCanceling={false}
        onCash={vi.fn()}
        onPayOs={vi.fn()}
        onCancelPayOs={vi.fn()}
        onPrint={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Tiền mặt" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hiện QR PayOS" })).toBeEnabled();
    expect(screen.getByText(/hủy QR trước/i)).toBeInTheDocument();
  });
});
