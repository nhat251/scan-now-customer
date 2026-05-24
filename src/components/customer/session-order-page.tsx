"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, CreditCard, Loader2, RefreshCw, UtensilsCrossed, XCircle } from "lucide-react";

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
    label: "Cho xac nhan",
    message: "Nhan vien se kiem tra va xac nhan don cua ban.",
    tone: "bg-warning text-warning-foreground",
  },
  Confirmed: {
    label: "Da xac nhan",
    message: "Don da duoc chuyen den bep.",
    tone: "bg-primary/10 text-primary",
  },
  Preparing: {
    label: "Dang chuan bi",
    message: "Bep dang chuan bi mon an cua ban.",
    tone: "bg-primary/10 text-primary",
  },
  PartiallyReady: {
    label: "Mot so mon da san sang",
    message: "Nhan vien se mang mon ra khi san sang.",
    tone: "bg-primary/10 text-primary",
  },
  ReadyToServe: {
    label: "San sang phuc vu",
    message: "Mon an dang duoc mang den ban.",
    tone: "bg-success text-success-foreground",
  },
  PartiallyServed: {
    label: "Dang phuc vu",
    message: "Mot so mon da duoc phuc vu.",
    tone: "bg-success text-success-foreground",
  },
  Served: {
    label: "Da phuc vu",
    message: "Tat ca mon da duoc phuc vu. Ban co the thanh toan.",
    tone: "bg-success text-success-foreground",
  },
  Completed: {
    label: "Da hoan tat",
    message: "Cam on ban da dung bua tai ScanNow.",
    tone: "bg-success text-success-foreground",
  },
  Cancelled: {
    label: "Da huy",
    message: "Don mon nay da bi huy.",
    tone: "bg-destructive/10 text-destructive",
  },
};

const PROGRESS_STEPS = ["Da gui", "Da xac nhan", "Dang chuan bi", "Phuc vu", "Hoan tat"];

const PROGRESS_INDEX: Record<OrderStatus, number> = {
  PendingConfirmation: 0,
  Confirmed: 1,
  Preparing: 2,
  PartiallyReady: 2,
  ReadyToServe: 3,
  PartiallyServed: 3,
  Served: 3,
  Completed: 4,
  Cancelled: 0,
};

const LIVE_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  idle: { label: "Dang khoi tao", dot: "bg-gray-300", text: "text-gray-500" },
  connecting: { label: "Dang ket noi", dot: "bg-warning", text: "text-gray-500" },
  connected: { label: "Cap nhat truc tiep", dot: "bg-success-foreground", text: "text-green-700" },
  reconnecting: { label: "Dang ket noi lai", dot: "bg-warning", text: "text-gray-600" },
  disconnected: { label: "Tam mat ket noi", dot: "bg-warning", text: "text-gray-600" },
  error: { label: "Cap nhat dinh ky", dot: "bg-warning", text: "text-gray-600" },
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
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto min-h-full w-full max-w-md pb-10">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <Logo size={16} textSize="text-xl" />
          <Button size="sm" variant="ghost" onClick={() => orderQuery.refetch()} disabled={orderQuery.isRefetching}>
            <RefreshCw className={cn("size-4", orderQuery.isRefetching && "animate-spin")} />
            Cap nhat
          </Button>
        </header>

        {liveStatus === "reconnecting" || liveStatus === "disconnected" || liveStatus === "error" ? (
          <p className="bg-warning/15 px-4 py-2 text-center text-xs font-semibold text-gray-600">
            Dang ket noi lai cap nhat truc tiep. Ban van co the bam Cap nhat.
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
            <h1 className="mt-3 text-xl font-bold">Khong the tai don hang</h1>
            <p className="mt-2 text-sm text-gray-500">
              {getCustomerApiErrorMessage(orderQuery.error, "Khong tim thay don hang nay.")}
            </p>
            <Button className="mt-5" onClick={() => orderQuery.refetch()}>
              Thu lai
            </Button>
          </section>
        ) : null}

        {order && status ? (
          <>
            <section className="px-4 pt-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Don mon</p>
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
                  <p className="text-gray-500">Tien trinh don duoc cap nhat tu bep va nhan vien.</p>
                  <span className={cn("flex shrink-0 items-center gap-1.5", liveIndicator.text)}>
                    <span className={cn("size-2 rounded-full", liveIndicator.dot, liveStatus === "connected" && "animate-pulse")} />
                    {liveIndicator.label}
                  </span>
                </div>
                {order.status !== "Cancelled" ? (
                  <ol className="mt-5 grid grid-cols-5 gap-1">
                    {PROGRESS_STEPS.map((step, index) => {
                      const isReached = index <= PROGRESS_INDEX[order.status];

                      return (
                        <li key={step} className="text-center">
                          <div className={cn("mx-auto size-2.5 rounded-full", isReached ? "bg-primary-container" : "bg-gray-200")} />
                          <p className={cn("mt-2 text-[10px] font-semibold", isReached ? "text-gray-700" : "text-gray-400")}>
                            {step}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </div>
            </section>

            <section className="mt-5 px-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">Mon da dat</h2>
                <p className="mt-1 text-xs text-gray-500">Trang thai dang duoc hien thi theo tien trinh chung cua don.</p>
                <div className="mt-4 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.orderItemId} className="flex justify-between gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold">{item.menuItemName}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                        {item.note ? <p className="mt-1 text-xs text-gray-500">Ghi chu: {item.note}</p> : null}
                      </div>
                      <p className="shrink-0 font-bold">{formatCurrency(item.subTotal)}</p>
                    </div>
                  ))}
                </div>
                <dl className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tam tinh</dt>
                    <dd className="font-semibold">{formatCurrency(order.subTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">VAT ({order.vatPercent}%)</dt>
                    <dd className="font-semibold">{formatCurrency(order.vatAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phi phuc vu ({order.serviceChargePercent}%)</dt>
                    <dd className="font-semibold">{formatCurrency(order.serviceChargeAmount)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                    <dt className="font-bold">Tong cong</dt>
                    <dd className="text-primary-container font-black">{formatCurrency(order.totalAmount)}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {order.status === "Served" || checkout || order.status === "Completed" ? (
              <section className="mt-5 px-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold">Thanh toan</h2>
                  {order.status === "Completed" ? (
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="size-5" />
                      Thanh toan da hoan tat.
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-gray-500">Mo cong thanh toan PayOS va quay lai day de xem trang thai.</p>
                      <Button
                        className="mt-4 w-full rounded-xl"
                        onClick={requestPayOSPayment}
                        disabled={checkoutMutation.isPending}
                      >
                        <CreditCard className="size-4" />
                        {checkout ? "Mo lai thanh toan PayOS" : "Thanh toan PayOS"}
                      </Button>
                      {checkout?.checkoutUrl ? (
                        <a
                          href={checkout.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary mt-4 block text-center text-sm font-semibold underline"
                        >
                          Mo lien ket thanh toan
                        </a>
                      ) : null}
                      {paymentStatusQuery.isFetching ? (
                        <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="size-4 animate-spin" />
                          Dang kiem tra thanh toan...
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
                  Menu
                </Link>
              </Button>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
};
