"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  useCashierCancelPaymentMutation,
  useCashierCheckoutMutation,
} from "@/hooks/mutations/useCashierMutations";
import type { CashierPaymentResponse } from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

type UseCashierPaymentOptions = {
  activeBranchId?: string;
  onOrderSelected: (orderId: string) => void;
  refreshData: () => Promise<void>;
  selectedOrder: OwnerTableOrderHistoryResponse | null;
};

export const useCashierPayment = ({
  activeBranchId,
  onOrderSelected,
  refreshData,
  selectedOrder,
}: UseCashierPaymentOptions) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [payOsPayment, setPayOsPayment] =
    useState<CashierPaymentResponse | null>(null);
  const { register, watch, setValue } = useForm({
    defaultValues: { amountReceivedInput: "" },
  });
  const amountReceivedInput = watch("amountReceivedInput");
  const checkoutMutation = useCashierCheckoutMutation();
  const cancelPaymentMutation = useCashierCancelPaymentMutation();
  const amountReceived = Number(amountReceivedInput);
  const cashChange =
    selectedOrder && Number.isFinite(amountReceived)
      ? amountReceived - selectedOrder.totalAmount
      : 0;
  const canConfirmCash = Boolean(
    selectedOrder &&
      Number.isFinite(amountReceived) &&
      amountReceived >= selectedOrder.totalAmount
  );
  const hasPendingPayOs =
    selectedOrder?.paymentMethod === "PAYOS" &&
    selectedOrder.paymentStatus === "PENDING";
  const activePayOsPayment =
    hasPendingPayOs && payOsPayment?.orderId === selectedOrder?.orderId
      ? payOsPayment
      : null;

  const checkout = async (
    paymentMethod: "CASH" | "PAYOS",
    amountReceivedValue?: number
  ) => {
    if (!selectedOrder || !activeBranchId) {
      return;
    }

    const response = await checkoutMutation.mutateAsync({
      branchId: activeBranchId,
      orderId: selectedOrder.orderId,
      request: {
        paymentMethod,
        voucherCode: voucherCode.trim() || null,
        amountReceived:
          paymentMethod === "CASH" ? amountReceivedValue : null,
      },
    });

    setVoucherCode("");
    setValue("amountReceivedInput", "");
    setCashDialogOpen(false);
    onOrderSelected(response.result.order.orderId);
    setPayOsPayment(
      response.result.paymentMethod === "PAYOS" ? response.result : null
    );
    await refreshData();
  };

  const openCashDialog = () => {
    if (!selectedOrder || hasPendingPayOs) {
      return;
    }

    setValue("amountReceivedInput", String(selectedOrder.totalAmount));
    setCashDialogOpen(true);
  };

  const confirmCashPayment = async () => {
    if (!canConfirmCash) {
      return;
    }

    await checkout("CASH", amountReceived);
  };

  const cancelCashierPayment = async () => {
    if (!selectedOrder || !activeBranchId) {
      return;
    }

    const response = await cancelPaymentMutation.mutateAsync({
      branchId: activeBranchId,
      orderId: selectedOrder.orderId,
    });

    setPayOsPayment(null);
    onOrderSelected(response.result.orderId);
    await refreshData();
  };

  return {
    activePayOsPayment,
    amountReceivedInput,
    canConfirmCash,
    cancelCashierPayment,
    cancelPaymentMutation,
    cashChange,
    cashDialogOpen,
    checkout,
    checkoutMutation,
    confirmCashPayment,
    hasPendingPayOs,
    openCashDialog,
    register,
    resetPayOsPayment: () => setPayOsPayment(null),
    setCashDialogOpen,
    setVoucherCode,
    voucherCode,
  };
};
