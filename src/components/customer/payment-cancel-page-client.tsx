"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { Log } from "@/lib/log";
import { cancelPendingPayment } from "@/services/public-ordering";

export const PaymentCancelPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get("sessionCode");
  const orderId = searchParams.get("orderId");

  const [cancelling, setCancelling] = useState(true);

  useEffect(() => {
    const handleCancel = async () => {
      if (!sessionCode) {
        setCancelling(false);
        return;
      }
      try {
        await cancelPendingPayment(sessionCode);
      } catch (err) {
        Log.error({ prefix: "PaymentCancel", message: "Cancel pending payment error", data: err });
      } finally {
        setCancelling(false);
      }
    };

    handleCancel();
  }, [sessionCode]);

  if (cancelling) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Spinner className="h-10 w-10 text-indigo-500" />
        <p className="mt-4 text-sm text-slate-400">Đang hủy giao dịch thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 ring-8 ring-rose-500/5">
          <XCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Đã hủy thanh toán</h2>
          <p className="px-2 text-sm leading-relaxed text-slate-400">
            Bạn đã hủy giao dịch chuyển khoản. Hóa đơn của bạn vẫn đang chờ được thanh toán.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {sessionCode && orderId && (
            <Button
              onClick={() => router.replace(PATH.customer.checkout(sessionCode, orderId))}
              className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
            >
              Chọn lại phương thức thanh toán
            </Button>
          )}
          {sessionCode && (
            <Button
              variant="ghost"
              onClick={() => router.replace(PATH.customer.menu(sessionCode))}
              className="w-full border border-slate-800 text-slate-300 hover:text-white"
            >
              Quay lại thực đơn
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
