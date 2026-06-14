/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { formatCurrency } from "@/components/customer/customer-session-utils";

type PayOsQrPanelProps = {
  qrCode?: string | null;
  checkoutUrl?: string | null;
  amount?: number | null;
  description?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bin?: string | null;
  expiresAt?: string | null;
  isChecking?: boolean;
  onCancel?: () => void;
  cancelDisabled?: boolean;
};

export const getQrImageSrc = (qrCode?: string | null, fallbackUrl?: string | null) => {
  const value = qrCode || fallbackUrl;
  if (!value) {
    return null;
  }

  if (
    value.startsWith("data:image/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(value)}`;
};

export const PayOsQrPanel = ({
  qrCode,
  checkoutUrl,
  amount,
  description,
  accountName,
  accountNumber,
  bin,
  expiresAt,
  isChecking,
  onCancel,
  cancelDisabled,
}: PayOsQrPanelProps) => {
  const qrImageSrc = getQrImageSrc(qrCode, checkoutUrl);
  const [fallbackExpiresAt] = useState(() => Date.now() + 10 * 60 * 1000);
  const targetTime = expiresAt ? new Date(expiresAt).getTime() : fallbackExpiresAt;
  const [remainingMs, setRemainingMs] = useState(Math.max(targetTime - Date.now(), 0));

  useEffect(() => {
    const updateRemaining = () => setRemainingMs(Math.max(targetTime - Date.now(), 0));
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
  const countdown = `${String(remainingMinutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
      <div className="flex items-center gap-2">
        <CreditCard className="text-primary-container size-5" />
        <h3 className="font-bold">PayOS QR</h3>
      </div>
      {qrImageSrc ? (
        <div className="mt-4 flex justify-center">
          <img
            src={qrImageSrc}
            alt="Mã QR thanh toán PayOS"
            className="size-64 rounded-xl bg-white p-3 shadow-sm"
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">Liên kết thanh toán này chưa có mã QR.</p>
      )}
      <dl className="mt-4 space-y-2 text-sm">
        {amount ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Số tiền</dt>
            <dd className="font-bold">{formatCurrency(amount)}</dd>
          </div>
        ) : null}
        {description ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Mô tả</dt>
            <dd className="font-bold">{description}</dd>
          </div>
        ) : null}
        {accountName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Chủ tài khoản</dt>
            <dd className="text-right font-bold">{accountName}</dd>
          </div>
        ) : null}
        {accountNumber ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Số tài khoản</dt>
            <dd className="font-bold">{accountNumber}</dd>
          </div>
        ) : null}
        {bin ? (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Mã BIN ngân hàng</dt>
            <dd className="font-bold">{bin}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs font-semibold text-gray-500">
        Mã QR hết hạn sau <span className="text-warning-foreground font-black">{countdown}</span>.
      </p>
      {isChecking ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" />
          Đang kiểm tra thanh toán...
        </p>
      ) : null}
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelDisabled}
          className="text-destructive border-destructive/30 mt-4 w-full rounded-xl border bg-white px-4 py-2 text-sm font-bold disabled:opacity-50"
        >
          Hủy thanh toán QR
        </button>
      ) : null}
    </div>
  );
};
