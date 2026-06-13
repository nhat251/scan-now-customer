"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { Log } from "@/lib/log";
import { getPaymentStatus } from "@/services/public-ordering";
import type { PaymentStatusResponse } from "@/types/public-ordering";

export const PaymentReturnPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get("sessionCode");
  const orderId = searchParams.get("orderId");
  const source = searchParams.get("source");

  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentStatusResponse | null>(null);

  const checkStatus = useCallback(async () => {
    if (!sessionCode) {
      setChecking(false);
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await getPaymentStatus(sessionCode);
      if (res.result) {
        setPaymentInfo(res.result);
      } else {
        setError("Không thể kiểm tra trạng thái giao dịch.");
      }
    } catch (err: unknown) {
      Log.error({ prefix: "PaymentReturn", message: "Check payment status error", data: err });
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Đã xảy ra lỗi khi kiểm tra thanh toán.");
      } else {
        setError("Đã xảy ra lỗi khi kiểm tra thanh toán.");
      }
    } finally {
      setChecking(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Spinner className="h-10 w-10 text-indigo-500" />
        <p className="mt-4 text-sm text-slate-400">
          Đang xác thực trạng thái thanh toán từ hệ thống...
        </p>
      </div>
    );
  }

  if (!sessionCode && source === "cashier") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 text-slate-100">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Thanh toán hoàn tất</h2>
            <p className="text-sm text-slate-400">
              Giao dịch thanh toán tại quầy đã hoàn thành. Vui lòng kiểm tra hóa đơn trên hệ thống
              thu ngân.
            </p>
          </div>
          {orderId && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-left font-mono text-xs text-slate-300">
              <span>Mã hóa đơn: {orderId}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || (!paymentInfo && sessionCode)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 text-slate-100">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 ring-8 ring-rose-500/5">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Lỗi xác thực</h2>
            <p className="text-sm text-slate-400">
              {error || "Không thể tải thông tin thanh toán."}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="ghost"
              onClick={checkStatus}
              className="flex-1 border border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
            {sessionCode && (
              <Button
                onClick={() => router.replace(PATH.customer.menu(sessionCode))}
                className="flex-1 bg-indigo-600 font-medium text-white hover:bg-indigo-500"
              >
                Về thực đơn
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const status = paymentInfo?.paymentStatus || "NO_PAYMENT";

  const renderStatusDetails = () => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: <CheckCircle className="h-8 w-8 text-emerald-400" />,
          bg: "bg-emerald-500/10 ring-8 ring-emerald-500/5",
          title: "Thanh toán thành công",
          desc: "Cảm ơn bạn! Hóa đơn của bạn đã được thanh toán hoàn tất. Nhà bếp đang chuẩn bị món ăn cho bạn.",
          cta: (
            <Button
              onClick={() => router.replace(PATH.customer.menu(sessionCode!))}
              className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
            >
              Quay lại thực đơn
            </Button>
          ),
        };
      case "PENDING":
        return {
          icon: <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />,
          bg: "bg-amber-500/10 ring-8 ring-amber-500/5",
          title: "Đang xử lý giao dịch",
          desc: "Hệ thống đang kiểm tra trạng thái chuyển khoản của bạn. Quá trình này có thể mất vài phút.",
          cta: (
            <div className="flex w-full flex-col gap-2">
              <Button
                onClick={checkStatus}
                className="w-full bg-amber-600 font-semibold text-white hover:bg-amber-500"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật trạng thái
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.replace(PATH.customer.menu(sessionCode!))}
                className="w-full border border-slate-800 text-slate-300 hover:text-white"
              >
                Về thực đơn
              </Button>
            </div>
          ),
        };
      case "FAILED":
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-rose-400" />,
          bg: "bg-rose-500/10 ring-8 ring-rose-500/5",
          title: "Thanh toán chưa hoàn tất",
          desc: "Giao dịch thanh toán chưa thành công hoặc đã bị hủy bỏ.",
          cta: (
            <div className="flex w-full flex-col gap-2">
              {orderId && (
                <Button
                  onClick={() =>
                    router.replace(PATH.customer.checkout(sessionCode!, orderId))
                  }
                  className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
                >
                  Thử thanh toán lại
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => router.replace(PATH.customer.menu(sessionCode!))}
                className="w-full border border-slate-800 text-slate-300 hover:text-white"
              >
                Quay lại thực đơn
              </Button>
            </div>
          ),
        };
    }
  };

  const details = renderStatusDetails();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${details.bg}`}
        >
          {details.icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">{details.title}</h2>
          <p className="px-2 text-sm leading-relaxed text-slate-400">{details.desc}</p>
        </div>

        {paymentInfo && (
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã hóa đơn:</span>
              <span className="font-mono text-white">
                #{orderId || paymentInfo.orderId.substring(0, 8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái đơn hàng:</span>
              <span className="font-semibold text-indigo-400">{paymentInfo.orderStatus}</span>
            </div>
          </div>
        )}

        <div className="pt-2">{details.cta}</div>
      </div>
    </div>
  );
};
