"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Clock, ConciergeBell, CookingPot, CreditCard, Loader2, Plus,RefreshCw, Utensils, UtensilsCrossed, XCircle } from "lucide-react";

import { PayOsQrPanel } from "@/components/payment/payos-qr-panel";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useCancelPublicPaymentMutation, useCreatePublicCheckoutMutation } from "@/hooks/mutations/useOrderMutations";
import { usePublicOrderDetailQuery, usePublicPaymentStatusQuery } from "@/hooks/queries/useOrderQueries";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { cn } from "@/lib/utils";
import type { CheckoutResponse, OrderStatus } from "@/types/order";

import { clearPersistedCustomerOrder,formatCurrency, getCustomerApiErrorMessage } from "./customer-session-utils";

type Props = {
  sessionCode: string;
  orderId: string;
};

const CUSTOMER_STATUS: Record<OrderStatus, { label: string; message: string; tone: string; iconBg: string; iconColor: string }> = {
  PendingConfirmation: {
    label: "Chờ bếp xác nhận",
    message: "Bếp sẽ nhận món và xác nhận đơn của bạn.",
    tone: "bg-warning text-warning-foreground",
    iconBg: "bg-warning/10",
    iconColor: "text-warning-foreground",
  },
  Confirmed: {
    label: "Bếp đã nhận",
    message: "Bếp đã nhận đơn và đang chuẩn bị món.",
    tone: "bg-primary/10 text-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  Preparing: {
    label: "Bếp đã nhận",
    message: "Bếp đã nhận đơn và đang chuẩn bị món.",
    tone: "bg-primary/10 text-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  PartiallyReady: {
    label: "Một số món đã sẵn sàng",
    message: "Nhân viên sẽ mang món ra khi sẵn sàng.",
    tone: "bg-primary-container/20 text-primary-container",
    iconBg: "bg-primary-container/10",
    iconColor: "text-primary-container",
  },
  ReadyToServe: {
    label: "Sẵn sàng phục vụ",
    message: "Món ăn đang được mang đến bàn.",
    tone: "bg-success-background text-success-text",
    iconBg: "bg-success-background/50",
    iconColor: "text-success-text",
  },
  PartiallyServed: {
    label: "Đang phục vụ",
    message: "Một số món đã được phục vụ.",
    tone: "bg-success-background text-success-text",
    iconBg: "bg-success-background/50",
    iconColor: "text-success-text",
  },
  Served: {
    label: "Đã phục vụ",
    message: "Tất cả món đã được phục vụ. Bạn có thể thanh toán.",
    tone: "bg-success-background text-success-text",
    iconBg: "bg-success-background/50",
    iconColor: "text-success-text",
  },
  Completed: {
    label: "Đã hoàn tất",
    message: "Cảm ơn bạn đã dùng bữa tại ScanNow.",
    tone: "bg-success-background text-success-text",
    iconBg: "bg-success-background/50",
    iconColor: "text-success-text",
  },
  Cancelled: {
    label: "Đã hủy",
    message: "Đơn món này đã bị hủy.",
    tone: "bg-error-container text-error",
    iconBg: "bg-error-container/50",
    iconColor: "text-error",
  },
};

const ORDER_TIMELINE = [
  {
    label: "Đã gửi đơn",
    description: "Thành công",
    icon: Check,
  },
  {
    label: "Chờ bếp xác nhận",
    description: "Bếp đang nhận món trong đơn của bạn.",
    icon: Clock,
  },
  {
    label: "Đang chuẩn bị",
    description: "Dự kiến 10-15 phút",
    icon: CookingPot,
  },
  {
    label: "Sẵn sàng phục vụ",
    description: "Sắp lên món",
    icon: ConciergeBell,
  },
] as const;

const CUSTOMER_ITEM_STATUS: Record<string, { label: string; tone: string }> = {
  Pending: {
    label: "Chờ bếp xác nhận",
    tone: "bg-warning/20 text-warning-foreground",
  },
  Confirmed: {
    label: "Bếp đã nhận / đang làm",
    tone: "bg-primary/10 text-primary",
  },
  Cooking: {
    label: "Bếp đã nhận / đang làm",
    tone: "bg-primary/10 text-primary",
  },
  Ready: {
    label: "Sẵn sàng phục vụ",
    tone: "bg-success text-success-foreground",
  },
  Served: {
    label: "Đã phục vụ",
    tone: "bg-success text-success-foreground",
  },
  Cancelled: {
    label: "Đã hủy",
    tone: "bg-destructive/10 text-destructive",
  },
};

const TIMELINE_CURRENT_INDEX: Record<OrderStatus, number | null> = {
  PendingConfirmation: 1,
  Confirmed: 2,
  Preparing: 2,
  PartiallyReady: 3,
  ReadyToServe: 3,
  PartiallyServed: null,
  Served: null,
  Completed: null,
  Cancelled: null,
};

const TIMELINE_COMPLETED_INDEX: Record<OrderStatus, number> = {
  PendingConfirmation: 0,
  Confirmed: 1,
  Preparing: 1,
  PartiallyReady: 2,
  ReadyToServe: 2,
  PartiallyServed: 3,
  Served: 3,
  Completed: 3,
  Cancelled: -1,
};

const formatOrderTime = (createdAt: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));

const LIVE_STATUS: Record<string, { label: string; dot: string; text: string; dotAnimation: string }> = {
  idle: { label: "Đang khởi tạo", dot: "bg-on-surface-variant/50", text: "text-on-surface-variant", dotAnimation: "" },
  connecting: { label: "Đang kết nối", dot: "bg-warning-foreground", text: "text-warning-foreground", dotAnimation: "" },
  connected: { label: "Đang cập nhật trực tiếp", dot: "bg-[#22c55e]", text: "text-[#16a34a]", dotAnimation: "animate-pulse" },
  reconnecting: { label: "Đang kết nối lại", dot: "bg-warning-foreground", text: "text-warning-foreground", dotAnimation: "" },
  disconnected: { label: "Tạm mất kết nối", dot: "bg-warning-foreground", text: "text-warning-foreground", dotAnimation: "" },
  error: { label: "Cập nhật định kỳ", dot: "bg-warning-foreground", text: "text-warning-foreground", dotAnimation: "" },
};

export const SessionOrderPage = ({ sessionCode, orderId }: Props) => {
  const router = useRouter();
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const hasRefetchedCompletedPayment = useRef(false);
  const { status: liveStatus, latestOrder } = useOrderUpdates(normalizedSessionCode, orderId);
  const orderQuery = usePublicOrderDetailQuery(normalizedSessionCode, orderId, liveStatus !== "connected");
  const checkoutMutation = useCreatePublicCheckoutMutation();
  const cancelPaymentMutation = useCancelPublicPaymentMutation();
  const order = liveStatus === "connected" && latestOrder ? latestOrder : orderQuery.data ?? latestOrder;
  const paymentStatusQuery = usePublicPaymentStatusQuery(
    normalizedSessionCode,
    checkout?.paymentMethod === "PAYOS" && order?.status !== "Completed"
  );
  const status = order ? CUSTOMER_STATUS[order.status] : undefined;
  const liveIndicator = LIVE_STATUS[liveStatus];
  const currentTimelineIndex = order ? TIMELINE_CURRENT_INDEX[order.status] : null;
  const completedTimelineIndex = order ? TIMELINE_COMPLETED_INDEX[order.status] : -1;
  const refetchOrder = orderQuery.refetch;

  useEffect(() => {
    if (paymentStatusQuery.data?.paymentStatus === "SUCCESS" && !hasRefetchedCompletedPayment.current) {
      hasRefetchedCompletedPayment.current = true;
      void refetchOrder();
    }
  }, [paymentStatusQuery.data?.paymentStatus, refetchOrder]);

  const requestPayOSPayment = async () => {
    const response = await checkoutMutation.mutateAsync({
      sessionCode: normalizedSessionCode,
      request: { paymentMethod: "PAYOS" },
    });

    setCheckout(response.result);
  };

  const cancelPayOSPayment = async () => {
    await cancelPaymentMutation.mutateAsync({ sessionCode: normalizedSessionCode });
    setCheckout(null);
    hasRefetchedCompletedPayment.current = false;
    await refetchOrder();
  };

  const handleReorder = () => {
    clearPersistedCustomerOrder(normalizedSessionCode);
    router.push(PATH.customer.sessionMenu(normalizedSessionCode));
  };

  return (
    <main className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed mx-auto flex min-h-screen max-w-[480px] flex-col gap-6 pb-32">
      {/* 1. Sticky Header */}
      <header className="border-outline-variant/30 sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-white/95 px-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Utensils className="text-primary size-6" />
          <h1 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">ScanNow</h1>
        </div>
        <button
          onClick={() => orderQuery.refetch()}
          disabled={orderQuery.isRefetching}
          className="hover:bg-surface-container-high text-on-surface-variant flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors duration-150 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-[18px]", orderQuery.isRefetching && "animate-spin")} />
          <span className="font-label-md text-label-md">Cập nhật</span>
        </button>
      </header>

      <div className="flex flex-col gap-6 px-4">
        {liveStatus === "reconnecting" || liveStatus === "disconnected" || liveStatus === "error" ? (
          <p className="bg-warning/30 text-warning-foreground rounded-xl px-4 py-2 text-center text-xs font-semibold">
            Đang kết nối lại cập nhật trực tiếp. Bạn vẫn có thể bấm Cập nhật.
          </p>
        ) : null}

        {orderQuery.isLoading && !order ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        ) : null}

        {orderQuery.isError && !order ? (
          <section className="border-outline-variant/30 flex flex-col gap-4 rounded-3xl border bg-white p-6 text-center shadow-sm">
            <XCircle className="text-error mx-auto size-12" />
            <h1 className="text-xl font-bold">Không thể tải đơn hàng</h1>
            <p className="text-on-surface-variant text-sm">
              {getCustomerApiErrorMessage(orderQuery.error, "Không tìm thấy đơn hàng này.")}
            </p>
            <Button className="bg-primary mt-2 text-white" onClick={() => orderQuery.refetch()}>
              Thử lại
            </Button>
          </section>
        ) : null}

        {order && status ? (
          <>
            {/* 2. Order Status Card */}
            <section className="border-primary-container/20 relative flex flex-col gap-5 overflow-hidden rounded-3xl border bg-white p-5 shadow-sm">
              <div className="z-10 flex items-start justify-between">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Mã đơn hàng</p>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-black">#{order.orderNumber}</h2>
                </div>
                <div className={cn("font-label-sm text-label-sm rounded-full px-3 py-1", status.tone)}>
                  {status.label}
                </div>
              </div>
              
              <div className="bg-surface-container-low z-10 flex items-start gap-4 rounded-2xl p-4">
                <div className={cn("rounded-full p-2", status.iconBg, status.iconColor)}>
                  {order.status === "Completed" ? (
                    <CheckCircle2 className="size-6" />
                  ) : order.status === "Preparing" ? (
                    <CookingPot className="size-6" />
                  ) : (
                    <Clock className="size-6" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                    {status.message}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", liveIndicator.dot, liveIndicator.dotAnimation)}></span>
                    <span className={cn("font-label-sm text-label-sm font-medium", liveIndicator.text)}>
                      {liveIndicator.label}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Timeline Steps */}
            {order.status !== "Cancelled" ? (
              <section className="relative mt-2 flex flex-col gap-6 px-4">
                {ORDER_TIMELINE.map((step, index) => {
                  const isCompleted = index <= completedTimelineIndex;
                  const isCurrent = index === currentTimelineIndex;
                  const Icon = isCompleted ? Check : step.icon;

                  return (
                    <div key={step.label} className="relative flex gap-5">
                      {/* Step Line */}
                      {index < ORDER_TIMELINE.length - 1 ? (
                        <div 
                          className={cn(
                            "absolute top-6 bottom-[-24px] left-[11px] w-[2px]",
                            index < completedTimelineIndex ? "bg-primary-container" : "bg-outline-variant/60"
                          )} 
                        />
                      ) : null}
                      
                      {/* Step Icon */}
                      <div 
                        className={cn(
                          "z-10 flex h-6 w-6 items-center justify-center rounded-full",
                          isCompleted && "bg-primary-container text-white",
                          isCurrent && "border-primary-container text-primary-container border-2 bg-white",
                          !isCompleted && !isCurrent && "bg-surface-variant text-on-surface-variant"
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={isCompleted || isCurrent ? 3 : 2} />
                      </div>
                      
                      {/* Step Text */}
                      <div className="flex flex-col pb-1">
                        <p 
                          className={cn(
                            "font-label-md text-label-md",
                            isCurrent ? "text-primary font-bold" : (isCompleted ? "text-on-surface font-bold" : "text-on-surface-variant opacity-60")
                          )}
                        >
                          {step.label}
                        </p>
                        {isCompleted || isCurrent ? (
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                            {index === 0 ? `${formatOrderTime(order.createdAt)} • ` : ""}
                            {step.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </section>
            ) : null}

            {/* 4. Order Summary Card */}
            <section className="border-outline-variant/30 overflow-hidden rounded-3xl border bg-white shadow-sm">
              <div className="border-surface-container border-b p-5">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Món đã đặt</h3>
              </div>
            </section>

            <section className="mt-5 px-4">
              <div className="rounded-3xl border border-orange-100/70 bg-white p-5 shadow-md shadow-orange-100/30">
                <h2 className="text-lg font-bold">Món đã đặt</h2>
                <p className="mt-1 text-xs text-gray-500">Mỗi món được cập nhật riêng theo xác nhận từ bếp.</p>
                <div className="mt-4 space-y-4">
                  {order.items.map((item) => {
                    const itemStatus = CUSTOMER_ITEM_STATUS[item.status] ?? CUSTOMER_ITEM_STATUS.Pending;

                    return (
                      <div key={item.orderItemId} className="flex justify-between gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{item.menuItemName}</p>
                            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", itemStatus.tone)}>
                              {itemStatus.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                          {item.note ? <p className="mt-1 text-xs text-gray-500">Ghi chú: {item.note}</p> : null}
                        </div>
                        <p className="shrink-0 font-bold">{formatCurrency(item.subTotal)}</p>
                      </div>
                    );
                  })}
                </div>
                <dl className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Tạm tính</p>
                    <p className="font-label-md text-label-md text-on-surface">{formatCurrency(order.subTotal)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">VAT ({order.vatPercent}%)</p>
                    <p className="font-label-md text-label-md text-on-surface">{formatCurrency(order.vatAmount)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Phí dịch vụ ({order.serviceChargePercent}%)</p>
                    <p className="font-label-md text-label-md text-on-surface">{formatCurrency(order.serviceChargeAmount)}</p>
                  </div>
                  <div className="border-surface-container mt-2 flex justify-between border-t pt-2">
                    <p className="font-headline-sm text-headline-sm text-on-surface">Tổng cộng</p>
                    <p className="font-headline-sm text-headline-sm text-primary-container font-black">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </dl>
              </div>
            </section>

            {/* 5. Payment Section */}
            {order.status === "Served" || checkout || order.status === "Completed" ? (
              <section className="mt-5 px-4">
                <div className="rounded-2xl border border-orange-100/70 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold">Thanh toán</h2>
                  {order.status === "Completed" ? (
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="size-5" />
                      Thanh toán đã hoàn tất.
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-gray-500">Quét QR PayOS bên dưới và giữ nguyên trang này để hệ thống cập nhật trạng thái.</p>
                      <Button
                        className="mt-4 w-full rounded-xl"
                        onClick={requestPayOSPayment}
                        disabled={checkoutMutation.isPending}
                      >
                        <CreditCard className="size-4" />
                        {checkout ? "Hiển thị lại QR PayOS" : "Thanh toán PayOS"}
                      </Button>
                      {checkout ? (
                        <div className="mt-4">
                          <PayOsQrPanel
                            qrCode={checkout.qrCode}
                            checkoutUrl={checkout.checkoutUrl}
                            amount={checkout.amount}
                            description={checkout.description}
                            accountName={checkout.accountName}
                            accountNumber={checkout.accountNumber}
                            bin={checkout.bin}
                            expiresAt={checkout.paymentExpiresAt}
                            isChecking={paymentStatusQuery.isFetching}
                            onCancel={cancelPayOSPayment}
                            cancelDisabled={cancelPaymentMutation.isPending}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </section>
            ) : null}

            {/* 6. Action Buttons */}
            <section className="flex flex-col gap-4">
              {order.status === "Completed" ? (
                <button
                  type="button"
                  onClick={handleReorder}
                  className="bg-primary font-headline-sm hover:bg-primary/90 shadow-primary/20 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-colors transition-transform active:scale-95"
                >
                  <Plus className="size-5" />
                  Đặt thêm món
                </button>
              ) : null}
              <Link 
                href={PATH.customer.sessionMenu(normalizedSessionCode)}
                className="border-primary-container/30 text-primary font-headline-sm hover:bg-primary-container/5 active-scale flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-4 text-base font-bold transition-colors transition-transform"
              >
                <UtensilsCrossed className="size-5" />
                Xem thực đơn
              </Link>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};
