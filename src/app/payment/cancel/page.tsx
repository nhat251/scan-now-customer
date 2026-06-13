"use client";

import { Suspense } from "react";

import { PaymentCancelPageClient } from "@/components/customer/payment-cancel-page-client";
import { Spinner } from "@/components/ui/spinner";

const PaymentCancelRoute = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
          <Spinner className="h-10 w-10 text-indigo-500" />
          <p className="mt-4 text-sm text-slate-400">Đang xử lý hủy thanh toán...</p>
        </div>
      }
    >
      <PaymentCancelPageClient />
    </Suspense>
  );
};

export default PaymentCancelRoute;
