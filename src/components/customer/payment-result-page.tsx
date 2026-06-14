"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Wallet, XCircle } from "lucide-react";

import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { usePublicPaymentStatusQuery } from "@/hooks/queries/useOrderQueries";
import { cn } from "@/lib/utils";

type PaymentResultPageProps = {
  result: "return" | "cancel";
};

export const PaymentResultPage = ({ result }: PaymentResultPageProps) => {
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get("sessionCode")?.toUpperCase() ?? "";
  const orderId = searchParams.get("orderId") ?? "";
  const isReturn = result === "return";
  const hasOrderTarget = Boolean(sessionCode && orderId);
  const paymentStatusQuery = usePublicPaymentStatusQuery(sessionCode, isReturn && hasOrderTarget);
  const isSuccess =
    paymentStatusQuery.data?.paymentStatus === "SUCCESS" ||
    paymentStatusQuery.data?.orderStatus === "Completed";
  const isChecking =
    isReturn &&
    hasOrderTarget &&
    (paymentStatusQuery.isLoading || paymentStatusQuery.isFetching) &&
    !isSuccess;
  const orderHref = hasOrderTarget ? PATH.customer.sessionOrder(sessionCode, orderId) : PATH.home;

  useEffect(() => {
    if (!isReturn || !hasOrderTarget || isSuccess) {
      return;
    }

    const timer = window.setTimeout(() => {
      void paymentStatusQuery.refetch();
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [hasOrderTarget, isReturn, isSuccess, paymentStatusQuery]);

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-orange-50/70 via-[#f8f9fa] to-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 py-6">
        <header className="flex items-center justify-center py-4">
          <Logo size={18} textSize="text-2xl" />
        </header>

        <section className="mt-10 rounded-3xl border border-orange-100/70 bg-white p-6 text-center shadow-md shadow-orange-100/30">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full",
              isSuccess
                ? "bg-success text-success-foreground"
                : isReturn
                  ? "bg-warning/20 text-warning-foreground"
                  : "bg-destructive/10 text-destructive"
            )}
          >
            {isChecking ? (
              <Loader2 className="size-8 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 className="size-9" />
            ) : isReturn ? (
              <Wallet className="size-8" />
            ) : (
              <XCircle className="size-8" />
            )}
          </div>

          <h1 className="mt-5 text-2xl font-black">
            {isSuccess
              ? "Thanh toán thành công"
              : isReturn
                ? "Đang kiểm tra thanh toán"
                : "Thanh toán chưa hoàn tất"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {isSuccess
              ? "Hệ thống đã ghi nhận thanh toán PayOS. Bạn có thể quay lại trang đơn hàng để xem trạng thái mới nhất."
              : isReturn
                ? "Nếu ngân hàng đã trừ tiền, vui lòng đợi vài giây rồi kiểm tra lại. Bạn cũng có thể quay lại đơn hàng."
                : "Bạn đã hủy hoặc chưa hoàn tất thanh toán PayOS. Hãy quay lại đơn hàng để thanh toán lại hoặc báo thu ngân nhận tiền mặt."}
          </p>

          {paymentStatusQuery.isError ? (
            <p className="bg-warning/15 text-warning-foreground mt-4 rounded-xl px-3 py-2 text-xs font-semibold">
              Chưa kiểm tra được trạng thái thanh toán. Vui lòng quay lại đơn hàng hoặc báo nhân
              viên hỗ trợ.
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            <Button asChild className="h-12 w-full rounded-2xl">
              <Link href={orderHref}>{isSuccess ? "Xem đơn hàng" : "Quay lại đơn hàng"}</Link>
            </Button>
            {!isSuccess && hasOrderTarget ? (
              <Button
                variant="outline"
                className="h-12 w-full rounded-2xl"
                onClick={() => paymentStatusQuery.refetch()}
              >
                <Loader2
                  className={cn("size-4", paymentStatusQuery.isFetching && "animate-spin")}
                />
                Kiểm tra lại thanh toán
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
};
