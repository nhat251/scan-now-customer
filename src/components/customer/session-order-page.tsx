"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  ConciergeBell,
  CookingPot,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Utensils,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";

import { useQueries } from "@tanstack/react-query";

import { PayOsQrPanel } from "@/components/payment/payos-qr-panel";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { QUERY_KEY } from "@/constants/queryKeys";
import {
  useCancelPublicPaymentMutation,
  useCreatePublicCheckoutMutation,
} from "@/hooks/mutations/useOrderMutations";
import {
  usePublicOrderDetailQuery,
  usePublicPaymentStatusQuery,
} from "@/hooks/queries/useOrderQueries";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { cn } from "@/lib/utils";
import { getOrderDetail } from "@/services/order";
import type { CheckoutResponse, CustomerOrderResponse, OrderStatus } from "@/types/order";

import {
  formatCurrency,
  getCustomerApiErrorMessage,
  readPersistedCustomerOrders,
} from "./customer-session-utils";

type Props = {
  sessionCode: string;
  orderId: string;
};

const CUSTOMER_STATUS: Record<
  OrderStatus,
  { label: string; message: string; tone: string; iconBg: string; iconColor: string }
> = {
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

const LIVE_STATUS: Record<
  string,
  { label: string; dot: string; text: string; dotAnimation: string }
> = {
  idle: {
    label: "Đang khởi tạo",
    dot: "bg-on-surface-variant/50",
    text: "text-on-surface-variant",
    dotAnimation: "",
  },
  connecting: {
    label: "Đang kết nối",
    dot: "bg-warning-foreground",
    text: "text-warning-foreground",
    dotAnimation: "",
  },
  connected: {
    label: "Đang cập nhật trực tiếp",
    dot: "bg-[#22c55e]",
    text: "text-[#16a34a]",
    dotAnimation: "animate-pulse",
  },
  reconnecting: {
    label: "Đang kết nối lại",
    dot: "bg-warning-foreground",
    text: "text-warning-foreground",
    dotAnimation: "",
  },
  disconnected: {
    label: "Tạm mất kết nối",
    dot: "bg-warning-foreground",
    text: "text-warning-foreground",
    dotAnimation: "",
  },
  error: {
    label: "Cập nhật định kỳ",
    dot: "bg-warning-foreground",
    text: "text-warning-foreground",
    dotAnimation: "",
  },
};

// ─── Single Order Card (accordion item) ──────────────────────────────────────

type OrderCardProps = {
  sessionCode: string;
  orderId: string;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrentOrder: boolean;
};

const OrderCard = ({
  sessionCode,
  orderId,
  isExpanded,
  onToggle,
  isCurrentOrder,
}: OrderCardProps) => {
  const { status: liveStatus, latestOrder } = useOrderUpdates(sessionCode, orderId);
  const orderQuery = usePublicOrderDetailQuery(
    sessionCode,
    orderId,
    liveStatus !== "connected"
  );
  const order =
    liveStatus === "connected" && latestOrder ? latestOrder : (orderQuery.data ?? latestOrder);
  const status = order ? CUSTOMER_STATUS[order.status] : undefined;
  const liveIndicator = LIVE_STATUS[liveStatus];
  const currentTimelineIndex = order ? TIMELINE_CURRENT_INDEX[order.status] : null;
  const completedTimelineIndex = order ? TIMELINE_COMPLETED_INDEX[order.status] : -1;
  const refetchOrder = orderQuery.refetch;



  // Summary line for collapsed view
  const itemSummary = order?.items
    .map((i) => `${i.menuItemName} (x${i.quantity})`)
    .join(", ");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300",
        isExpanded
          ? "border-primary/30 shadow-primary/10 shadow-md"
          : "border-outline-variant/30",
        isCurrentOrder && !isExpanded && "border-primary/20"
      )}
    >
      {/* ── Accordion Header ── */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0 flex-1">
          {/* Order number + time */}
          <div className="flex items-center gap-2 flex-wrap">
            {order ? (
              <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-0.5 text-sm font-black tracking-wide">
                {order.orderNumber}
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-400 rounded-lg px-2.5 py-0.5 text-sm font-bold">
                ...
              </span>
            )}
            {order && (
              <span className="text-on-surface-variant text-sm">
                {formatOrderTime(order.createdAt)}
              </span>
            )}
            {status && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  status.tone
                )}
              >
                {status.label}
              </span>
            )}
          </div>

          {/* Item count + total */}
          {order ? (
            <div className="mt-1.5">
              <p className="text-on-surface text-[15px] font-bold">
                {order.items.length} món · {formatCurrency(order.totalAmount)}
              </p>
              {!isExpanded && itemSummary && (
                <p className="text-primary mt-0.5 truncate text-sm">
                  {itemSummary}
                </p>
              )}
            </div>
          ) : orderQuery.isLoading ? (
            <div className="mt-2 flex items-center gap-2">
              <Loader2 className="text-primary size-4 animate-spin" />
              <span className="text-on-surface-variant text-sm">Đang tải...</span>
            </div>
          ) : null}
        </div>

        <div className="mt-0.5 shrink-0 text-on-surface-variant">
          {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        </div>
      </button>

      {/* ── Accordion Body ── */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-5 pt-4">
          {orderQuery.isLoading && !order ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="text-primary size-8 animate-spin" />
            </div>
          ) : orderQuery.isError && !order ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="text-error size-10" />
              <p className="text-on-surface-variant text-sm">
                {getCustomerApiErrorMessage(orderQuery.error, "Không tải được đơn hàng.")}
              </p>
              <Button size="sm" onClick={() => orderQuery.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : order && status ? (
            <div className="flex flex-col gap-5">
              {/* Status message + live indicator */}
              <div className="bg-surface-container-low flex items-start gap-4 rounded-2xl p-4">
                <div className={cn("rounded-full p-2", status.iconBg, status.iconColor)}>
                  {order.status === "Completed" ? (
                    <CheckCircle2 className="size-5" />
                  ) : order.status === "Preparing" ? (
                    <CookingPot className="size-5" />
                  ) : (
                    <Clock className="size-5" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                    {status.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        liveIndicator.dot,
                        liveIndicator.dotAnimation
                      )}
                    />
                    <span className={cn("font-label-sm text-label-sm font-medium", liveIndicator.text)}>
                      {liveIndicator.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {order.status !== "Cancelled" ? (
                <div className="relative flex flex-col gap-5 px-2">
                  {ORDER_TIMELINE.map((step, index) => {
                    const isCompleted = index <= completedTimelineIndex;
                    const isCurrent = index === currentTimelineIndex;
                    const Icon = isCompleted ? Check : step.icon;

                    return (
                      <div key={step.label} className="relative flex gap-4">
                        {index < ORDER_TIMELINE.length - 1 ? (
                          <div
                            className={cn(
                              "absolute top-6 bottom-[-20px] left-[11px] w-[2px]",
                              index < completedTimelineIndex
                                ? "bg-primary-container"
                                : "bg-outline-variant/60"
                            )}
                          />
                        ) : null}

                        <div
                          className={cn(
                            "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                            isCompleted && "bg-primary-container text-white",
                            isCurrent &&
                              "border-primary-container text-primary-container border-2 bg-white",
                            !isCompleted &&
                              !isCurrent &&
                              "bg-surface-variant text-on-surface-variant"
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={isCompleted || isCurrent ? 3 : 2} />
                        </div>

                        <div className="flex flex-col pb-1">
                          <p
                            className={cn(
                              "font-label-md text-label-md",
                              isCurrent
                                ? "text-primary font-bold"
                                : isCompleted
                                  ? "text-on-surface font-bold"
                                  : "text-on-surface-variant opacity-60"
                            )}
                          >
                            {step.label}
                          </p>
                          {(isCompleted || isCurrent) && (
                            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                              {index === 0 ? `${formatOrderTime(order.createdAt)} • ` : ""}
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Items list */}
              <div className="rounded-2xl border border-orange-100/70 bg-white p-4 shadow-sm shadow-orange-100/30">
                <h3 className="text-base font-bold">Món đã đặt</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Mỗi món được cập nhật riêng theo xác nhận từ bếp.
                </p>
                <div className="mt-3 space-y-3">
                  {order.items.map((item) => {
                    const itemStatus =
                      CUSTOMER_ITEM_STATUS[item.status] ?? CUSTOMER_ITEM_STATUS.Pending;
                    return (
                      <div
                        key={item.orderItemId}
                        className="flex justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm">{item.menuItemName}</p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                itemStatus.tone
                              )}
                            >
                              {itemStatus.label}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                          {item.note && (
                            <p className="mt-0.5 text-xs text-gray-400">Ghi chú: {item.note}</p>
                          )}
                        </div>
                        <p className="shrink-0 text-sm font-bold">{formatCurrency(item.subTotal)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
                  <div className="flex justify-between">
                    <p className="text-on-surface-variant">Tạm tính</p>
                    <p className="font-medium">{formatCurrency(order.subTotal)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-on-surface-variant">VAT ({order.vatPercent}%)</p>
                    <p className="font-medium">{formatCurrency(order.vatAmount)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-on-surface-variant">
                      Phí dịch vụ ({order.serviceChargePercent}%)
                    </p>
                    <p className="font-medium">{formatCurrency(order.serviceChargeAmount)}</p>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-gray-100 pt-2">
                    <p className="font-bold">Tổng cộng</p>
                    <p className="text-primary-container font-black">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </dl>
              </div>



              {/* Refresh button for this order */}
              <button
                type="button"
                onClick={() => orderQuery.refetch()}
                disabled={orderQuery.isRefetching}
                className="hover:bg-surface-container-high text-on-surface-variant flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors duration-150 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={cn("size-4", orderQuery.isRefetching && "animate-spin")} />
                Cập nhật đơn này
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// ─── Session Payment Summary ──────────────────────────────────────────────────

function SessionPaymentSummary({ sessionCode, allOrderIds }: { sessionCode: string; allOrderIds: string[] }) {
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const hasRefetchedCompletedPayment = useRef(false);
  const checkoutMutation = useCreatePublicCheckoutMutation();
  const cancelPaymentMutation = useCancelPublicPaymentMutation();
  
  const orderQueries = useQueries({
    queries: allOrderIds.map((id) => ({
      queryKey: [QUERY_KEY.PUBLIC_ORDER, sessionCode, id],
      queryFn: () => getOrderDetail(sessionCode, id),
      select: (response: any) => response?.data?.result,
    })),
  });

  const orders = orderQueries.map(q => q.data).filter(Boolean) as CustomerOrderResponse[];
  
  const refetchAll = async () => {
    await Promise.all(orderQueries.map(q => q.refetch()));
  };

  const isAlreadyCompleted = orders.length > 0 && orders.every(o => o.status === "Completed");
  const canCheckout = orders.length > 0 && orders.every(o => o.status === "Served" || o.status === "Completed");

  const paymentStatusQuery = usePublicPaymentStatusQuery(
    sessionCode,
    checkout?.paymentMethod === "PAYOS" && !isAlreadyCompleted
  );

  useEffect(() => {
    if (
      paymentStatusQuery.data?.paymentStatus === "SUCCESS" &&
      !hasRefetchedCompletedPayment.current
    ) {
      hasRefetchedCompletedPayment.current = true;
      void refetchAll();
    }
  }, [paymentStatusQuery.data?.paymentStatus]);

  const requestPayOSPayment = async () => {
    const response = await checkoutMutation.mutateAsync({
      sessionCode,
      request: { paymentMethod: "PAYOS" },
    });
    setCheckout(response.result);
  };

  const cancelPayOSPayment = async () => {
    await cancelPaymentMutation.mutateAsync({ sessionCode });
    setCheckout(null);
    hasRefetchedCompletedPayment.current = false;
    await refetchAll();
  };

  if (orders.length === 0) return null;

  const aggregatedSubTotal = orders.reduce((sum, o) => sum + o.subTotal, 0);
  const aggregatedVat = orders.reduce((sum, o) => sum + o.vatAmount, 0);
  const aggregatedService = orders.reduce((sum, o) => sum + o.serviceChargeAmount, 0);
  const aggregatedTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm mt-2">
      <h3 className="text-lg font-bold">Tổng hoá đơn</h3>
      
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <p className="text-on-surface-variant">Tạm tính ({orders.length} đơn)</p>
          <p className="font-medium">{formatCurrency(aggregatedSubTotal)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-on-surface-variant">VAT</p>
          <p className="font-medium">{formatCurrency(aggregatedVat)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-on-surface-variant">Phí dịch vụ</p>
          <p className="font-medium">{formatCurrency(aggregatedService)}</p>
        </div>
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-3">
          <p className="font-bold text-base">Tổng cộng</p>
          <p className="text-primary font-black text-lg">{formatCurrency(aggregatedTotal)}</p>
        </div>
      </dl>

      <div className="mt-6 border-t border-gray-100 pt-5">
        <h4 className="font-bold">Thanh toán</h4>
        {isAlreadyCompleted ? (
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="size-5" />
            Thanh toán đã hoàn tất.
          </p>
        ) : !canCheckout ? (
          <p className="mt-2 text-sm text-warning-foreground bg-warning/10 p-3 rounded-xl border border-warning/20">
            Vui lòng chờ bếp chuẩn bị và phục vụ xong các món để thanh toán.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-500 mb-3">
              Quét QR PayOS bên dưới để thanh toán cho toàn bộ phiên.
            </p>
            <Button
              className="w-full rounded-xl"
              onClick={requestPayOSPayment}
              disabled={checkoutMutation.isPending}
            >
              <CreditCard className="size-4 mr-2" />
              {checkout ? "Hiển thị lại QR PayOS" : "Thanh toán PayOS"}
            </Button>
            {checkout && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SessionOrderPage = ({ sessionCode, orderId }: Props) => {
  const router = useRouter();
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [allOrderIds, setAllOrderIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(orderId);

  // Load all tracked order IDs for this session
  useEffect(() => {
    const all = readPersistedCustomerOrders(normalizedSessionCode);
    // Put the current orderId first if present, then the rest in reverse (newest first)
    const withoutCurrent = all.filter((id) => id !== orderId);
    const sorted = [orderId, ...withoutCurrent.reverse()];
    setAllOrderIds(sorted);
  }, [normalizedSessionCode, orderId]);

  const handleReorder = () => {
    // Do NOT clear persisted orders here — we want to keep tracking all existing orders.
    // The new order will be added to the list via persistCustomerOrder in the checkout flow.
    router.push(PATH.customer.sessionMenu(normalizedSessionCode));
  };

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed mx-auto flex min-h-screen max-w-[480px] flex-col gap-6 pb-32">
      {/* Sticky Header */}
      <header className="border-outline-variant/30 sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-white/95 px-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href={PATH.customer.sessionMenu(normalizedSessionCode)}
            className="hover:bg-surface-container-high text-primary flex size-10 items-center justify-center rounded-full transition-colors duration-150 active:scale-95"
            aria-label="Quay lại menu"
          >
            <ChevronLeft className="size-6" />
          </Link>
          <Utensils className="text-primary size-6" />
          <h1 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
            ScanNow
          </h1>
        </div>
        <div className="text-on-surface-variant text-sm font-medium">
          Theo dõi đơn hàng
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4">
        {/* Section title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              Phiên {normalizedSessionCode}
            </p>
            <h2 className="text-on-surface text-lg font-bold">
              {allOrderIds.length > 1
                ? `${allOrderIds.length} đơn hàng`
                : "Đơn hàng của bạn"}
            </h2>
          </div>
        </div>

        {/* Order cards list */}
        {allOrderIds.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allOrderIds.map((id) => (
              <OrderCard
                key={id}
                sessionCode={normalizedSessionCode}
                orderId={id}
                isExpanded={expandedId === id}
                onToggle={() => handleToggle(id)}
                isCurrentOrder={id === orderId}
              />
            ))}
          </div>
        )}

        <SessionPaymentSummary sessionCode={normalizedSessionCode} allOrderIds={allOrderIds} />

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            onClick={handleReorder}
            className="bg-primary font-headline-sm hover:bg-primary/90 shadow-primary/20 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-colors transition-transform active:scale-95"
          >
            <Plus className="size-5" />
            Đặt thêm món
          </button>

          <Link
            href={PATH.customer.sessionMenu(normalizedSessionCode)}
            className="border-primary-container/30 text-primary font-headline-sm hover:bg-primary-container/5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-4 text-base font-bold transition-colors transition-transform active:scale-95"
          >
            <UtensilsCrossed className="size-5" />
            Xem thực đơn
          </Link>
        </div>
      </div>
    </main>
  );
};
