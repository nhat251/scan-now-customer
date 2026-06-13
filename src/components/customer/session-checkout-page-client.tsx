"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  ChevronLeft,
  CreditCard,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { Log } from "@/lib/log";
import { checkoutSession, getOrderDetail } from "@/services/public-ordering";
import type { CustomerOrderResponse } from "@/types/public-ordering";

export const SessionCheckoutPageClient = ({ sessionCode }: { sessionCode: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CustomerOrderResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PAYOS" | "CASH">("PAYOS");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Không tìm thấy thông tin đơn hàng cần thanh toán.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getOrderDetail(sessionCode, orderId);
        if (res.result) {
          setOrder(res.result);
        } else {
          setError("Không thể tải thông tin đơn hàng.");
        }
      } catch (err: unknown) {
        Log.error({ prefix: "SessionCheckout", message: "Fetch order detail error", data: err });
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Đã xảy ra lỗi khi tải đơn hàng.");
        } else {
          setError("Đã xảy ra lỗi khi tải đơn hàng.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionCode, orderId]);

  const handleCheckout = async () => {
    if (!orderId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await checkoutSession(sessionCode, { paymentMethod });
      if (paymentMethod === "PAYOS") {
        if (res.result && res.result.checkoutUrl) {
          window.location.href = res.result.checkoutUrl;
        } else {
          setError(
            "Không nhận được link thanh toán online. Vui lòng thử lại hoặc chọn thanh toán tại quầy."
          );
        }
      } else {
        setCheckoutSuccessMessage(
          "Yêu cầu thanh toán tiền mặt tại quầy đã được ghi nhận. Vui lòng di chuyển đến quầy thu ngân để hoàn tất thanh toán."
        );
      }
    } catch (err: unknown) {
      Log.error({ prefix: "SessionCheckout", message: "Checkout error", data: err });
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Đã xảy ra lỗi khi tạo yêu cầu thanh toán.");
      } else {
        setError("Đã xảy ra lỗi khi tạo yêu cầu thanh toán.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Spinner className="h-10 w-10 text-indigo-500" />
        <p className="mt-4 text-sm text-slate-400">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-semibold text-white">Lỗi thanh toán</h2>
          <p className="mt-2 text-sm text-slate-400">{error || "Đơn hàng không tồn tại."}</p>
          <Button
            onClick={() => router.replace(PATH.customer.menu(sessionCode))}
            className="mt-6 w-full bg-indigo-600 font-medium text-white hover:bg-indigo-500"
          >
            Quay lại thực đơn
          </Button>
        </div>
      </div>
    );
  }

  if (checkoutSuccessMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-wide text-white">Yêu cầu đã ghi nhận</h2>
            <p className="text-sm text-slate-300">{checkoutSuccessMessage}</p>
          </div>
          <Button
            onClick={() => router.replace(PATH.customer.menu(sessionCode))}
            className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
          >
            Quay lại thực đơn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 p-4 backdrop-blur-lg">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-white">Thanh toán đơn hàng</h1>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4 pb-28">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="text-xs text-slate-400">Mã hóa đơn</p>
              <p className="text-sm font-semibold text-white">#{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Trạng thái</p>
              <span className="inline-block rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                {order.status}
              </span>
            </div>
          </div>

          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {order.items.map((item) => (
              <div key={item.orderItemId} className="flex justify-between text-sm">
                <div>
                  <span className="font-semibold text-indigo-400">{item.quantity}x</span>{" "}
                  <span className="text-slate-200">{item.menuItemName}</span>
                  {item.note && (
                    <span className="block text-[11px] text-slate-500 italic">
                      Ghi chú: {item.note}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-300">{formatVND(item.subTotal)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Tạm tính</span>
              <span>{formatVND(order.subTotal)}</span>
            </div>
            {order.vatAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>VAT ({order.vatPercent}%)</span>
                <span>{formatVND(order.vatAmount)}</span>
              </div>
            )}
            {order.serviceChargeAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Phí dịch vụ ({order.serviceChargePercent}%)</span>
                <span>{formatVND(order.serviceChargeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800/50 pt-1 text-base font-bold text-white">
              <span>Tổng thanh toán</span>
              <span className="text-indigo-400">{formatVND(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="pl-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Chọn phương thức thanh toán
          </h3>

          <div className="grid gap-3">
            <div
              onClick={() => setPaymentMethod("PAYOS")}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                paymentMethod === "PAYOS"
                  ? "border-indigo-500 bg-indigo-500/5 text-white"
                  : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Thanh toán Online (PayOS)</p>
                <p className="mt-0.5 text-xs text-slate-400">Chuyển khoản QR ngân hàng tự động</p>
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod("CASH")}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                paymentMethod === "CASH"
                  ? "border-indigo-500 bg-indigo-500/5 text-white"
                  : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Thanh toán tại quầy</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Thanh toán bằng tiền mặt / thẻ tại thu ngân
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs text-amber-400">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <p className="leading-relaxed">
            Hệ thống không ghi nhận giao dịch thành công ngay trên giao diện này. Trạng thái hóa đơn
            sẽ tự động cập nhật khi hệ thống thanh toán hoặc Thu ngân xác nhận hóa đơn.
          </p>
        </div>
      </main>

      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-800 bg-slate-900/90 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          <Button
            disabled={submitting}
            onClick={handleCheckout}
            className="w-full bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-500"
          >
            {submitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Đang tạo yêu cầu...
              </>
            ) : paymentMethod === "PAYOS" ? (
              "Tiến hành thanh toán online"
            ) : (
              "Xác nhận thanh toán tại quầy"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
