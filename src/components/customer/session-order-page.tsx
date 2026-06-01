"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Clock3, ConciergeBell, CookingPot, CreditCard, Loader2, RefreshCw, UtensilsCrossed, XCircle } from "lucide-react";

import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useCreatePublicCheckoutMutation } from "@/hooks/mutations/useOrderMutations";
import { usePublicOrderDetailQuery, usePublicPaymentStatusQuery } from "@/hooks/queries/useOrderQueries";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { cn } from "@/lib/utils";
import type { CheckoutResponse, OrderStatus } from "@/types/order";

import { formatCurrency, getCustomerApiErrorMessage } from "./customer-session-utils";

type Props = {
  sessionCode: string;
  orderId: string;
};

const CUSTOMER_STATUS: Record<OrderStatus, { label: string; message: string; tone: string }> = {
  PendingConfirmation: {
    label: "Chờ bếp xác nhận",
    message: "Bếp sẽ nhận món và xác nhận đơn của bạn.",
    tone: "bg-warning text-warning-foreground",
  },
  Confirmed: {
    label: "Bếp đã nhận",
    message: "Bếp đã nhận đơn và đang chuẩn bị món.",
    tone: "bg-primary/10 text-primary",
  },
  Preparing: {
    label: "Bếp đã nhận",
    message: "Bếp đã nhận đơn và đang chuẩn bị món.",
    tone: "bg-primary/10 text-primary",
  },
  PartiallyReady: {
    label: "Một số món đã sẵn sàng",
    message: "Nhân viên sẽ mang món ra khi sẵn sàng.",
    tone: "bg-primary/10 text-primary",
  },
  ReadyToServe: {
    label: "Sẵn sàng phục vụ",
    message: "Món ăn đang được mang đến bàn.",
    tone: "bg-success text-success-foreground",
  },
  PartiallyServed: {
    label: "Đang phục vụ",
    message: "Một số món đã được phục vụ.",
    tone: "bg-success text-success-foreground",
  },
  Served: {
    label: "Đã phục vụ",
    message: "Tất cả món đã được phục vụ. Bạn có thể thanh toán.",
    tone: "bg-success text-success-foreground",
  },
  Completed: {
    label: "Đã hoàn tất",
    message: "Cảm ơn bạn đã dùng bữa tại ScanNow.",
    tone: "bg-success text-success-foreground",
  },
  Cancelled: {
    label: "Đã hủy",
    message: "Đơn món này đã bị hủy.",
    tone: "bg-destructive/10 text-destructive",
  },
};

const ORDER_TIMELINE = [
  {
    label: "Đã gửi đơn",
    description: "Chúng tôi đã nhận được đơn món của bạn.",
    icon: Check,
  },
  {
    label: "Chờ bếp xác nhận",
    description: "Bếp đang nhận món trong đơn của bạn.",
    icon: Clock3,
  },
  {
    label: "Đang chuẩn bị",
    description: "Bếp đang chuẩn bị món ăn của bạn.",
    icon: CookingPot,
  },
  {
    label: "Sẵn sàng phục vụ",
    description: "Món ăn sẽ sớm được mang ra bàn.",
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

const LIVE_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  idle: { label: "Đang khởi tạo", dot: "bg-gray-300", text: "text-gray-500" },
  connecting: { label: "Đang kết nối", dot: "bg-warning", text: "text-gray-500" },
  connected: { label: "Cập nhật trực tiếp", dot: "bg-success-foreground", text: "text-green-700" },
  reconnecting: { label: "Đang kết nối lại", dot: "bg-warning", text: "text-gray-600" },
  disconnected: { label: "Tạm mất kết nối", dot: "bg-warning", text: "text-gray-600" },
  error: { label: "Cập nhật định kỳ", dot: "bg-warning", text: "text-gray-600" },
};

export const SessionOrderPage = ({ sessionCode, orderId }: Props) => {
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const hasRefetchedCompletedPayment = useRef(false);
  const { status: liveStatus, latestOrder } = useOrderUpdates(normalizedSessionCode, orderId);
  const orderQuery = usePublicOrderDetailQuery(normalizedSessionCode, orderId, liveStatus !== "connected");
  const checkoutMutation = useCreatePublicCheckoutMutation();
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

    if (response.result.checkoutUrl) {
      window.open(response.result.checkoutUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-orange-50/70 via-[#f8f9fa] to-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto min-h-full w-full max-w-md pb-10">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-orange-50 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md">
          <Logo size={16} textSize="text-xl" />
          <Button size="sm" variant="ghost" onClick={() => orderQuery.refetch()} disabled={orderQuery.isRefetching}>
            <RefreshCw className={cn("size-4", orderQuery.isRefetching && "animate-spin")} />
            Cập nhật
          </Button>
        </header>

        {liveStatus === "reconnecting" || liveStatus === "disconnected" || liveStatus === "error" ? (
          <p className="bg-warning/15 px-4 py-2 text-center text-xs font-semibold text-gray-600">
            Đang kết nối lại cập nhật trực tiếp. Bạn vẫn có thể bấm Cập nhật.
          </p>
        ) : null}

        {orderQuery.isLoading && !order ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="text-primary-container size-8 animate-spin" />
          </div>
        ) : null}

        {orderQuery.isError && !order ? (
          <section className="m-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <XCircle className="text-destructive mx-auto size-10" />
            <h1 className="mt-3 text-xl font-bold">Không thể tải đơn hàng</h1>
            <p className="mt-2 text-sm text-gray-500">
              {getCustomerApiErrorMessage(orderQuery.error, "Không tìm thấy đơn hàng này.")}
            </p>
            <Button className="mt-5" onClick={() => orderQuery.refetch()}>
              Thử lại
            </Button>
          </section>
        ) : null}

        {order && status ? (
          <>
            <section className="px-4 pt-6">
              <div className="rounded-3xl border border-orange-100/70 bg-white p-5 shadow-md shadow-orange-100/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Đơn món của bạn</p>
                    <h1 className="mt-1 text-lg font-black">{order.orderNumber}</h1>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status.tone)}>{status.label}</span>
                </div>
                <div className="mt-5 rounded-2xl bg-orange-50 p-4">
                  <p className="flex gap-3 text-sm font-semibold text-gray-700">
                    {order.status === "Completed" ? (
                      <CheckCircle2 className="text-success-foreground size-5 shrink-0" />
                    ) : (
                      <Clock3 className="text-primary-container size-5 shrink-0" />
                    )}
                    {status.message}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold">
                  <p className="text-gray-500">Tiến trình được cập nhật từ bếp và nhân viên.</p>
                  <span className={cn("flex shrink-0 items-center gap-1.5", liveIndicator.text)}>
                    <span className={cn("size-2 rounded-full", liveIndicator.dot, liveStatus === "connected" && "animate-pulse")} />
                    {liveIndicator.label}
                  </span>
                </div>
                {order.status !== "Cancelled" ? (
                  <ol className="mt-6">
                    {ORDER_TIMELINE.map((step, index) => {
                      const isCompleted = index <= completedTimelineIndex;
                      const isCurrent = index === currentTimelineIndex;
                      const Icon = isCompleted ? Check : step.icon;
                      const showDescription = index === 0 || isCurrent;

                      return (
                        <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                          {index < ORDER_TIMELINE.length - 1 ? (
                            <span
                              className={cn(
                                "absolute top-7 bottom-0 left-[13px] w-px",
                                index < completedTimelineIndex ? "bg-orange-400" : "bg-orange-100"
                              )}
                            />
                          ) : null}
                          <span
                            className={cn(
                              "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                              isCompleted && "bg-orange-500 text-white",
                              isCurrent && "border-2 border-orange-500 bg-white text-orange-500",
                              !isCompleted && !isCurrent && "bg-slate-50 text-slate-300"
                            )}
                          >
                            <Icon className="size-3.5" />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p
                              className={cn(
                                "text-sm font-bold",
                                isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"
                              )}
                            >
                              {step.label}
                            </p>
                            {showDescription ? (
                              <>
                                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
                                {index === 0 ? (
                                  <p className="mt-1 text-xs font-semibold text-orange-500">{formatOrderTime(order.createdAt)}</p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
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
                    <dt className="text-gray-500">Tạm tính</dt>
                    <dd className="font-semibold">{formatCurrency(order.subTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">VAT ({order.vatPercent}%)</dt>
                    <dd className="font-semibold">{formatCurrency(order.vatAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phí phục vụ ({order.serviceChargePercent}%)</dt>
                    <dd className="font-semibold">{formatCurrency(order.serviceChargeAmount)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                    <dt className="font-bold">Tổng cộng</dt>
                    <dd className="text-primary-container font-black">{formatCurrency(order.totalAmount)}</dd>
                  </div>
                </dl>
              </div>
            </section>

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
                      <p className="mt-2 text-sm text-gray-500">Mở cổng thanh toán PayOS và quay lại đây để xem trạng thái.</p>
                      <Button
                        className="mt-4 w-full rounded-xl"
                        onClick={requestPayOSPayment}
                        disabled={checkoutMutation.isPending}
                      >
                        <CreditCard className="size-4" />
                        {checkout ? "Mở lại thanh toán PayOS" : "Thanh toán PayOS"}
                      </Button>
                      {checkout?.checkoutUrl ? (
                        <a
                          href={checkout.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary mt-4 block text-center text-sm font-semibold underline"
                        >
                          Mở liên kết thanh toán
                        </a>
                      ) : null}
                      {paymentStatusQuery.isFetching ? (
                        <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="size-4 animate-spin" />
                          Đang kiểm tra thanh toán...
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </section>
            ) : null}

            <section className="mt-5 flex gap-3 px-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href={PATH.customer.sessionMenu(normalizedSessionCode)}>
                  <UtensilsCrossed className="size-4" />
                  Xem thực đơn
                </Link>
              </Button>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};
