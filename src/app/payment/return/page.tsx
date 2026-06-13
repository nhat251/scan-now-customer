"use client";

import { Suspense } from "react";

import { PaymentReturnPageClient } from "@/components/customer/payment-return-page-client";
import { Spinner } from "@/components/ui/spinner";

const PaymentReturnRoute = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
          <Spinner className="h-10 w-10 text-indigo-500" />
          <p className="mt-4 text-sm text-slate-400">Đang tải kết quả thanh toán...</p>
        </div>
      }
    >
      <PaymentReturnPageClient />
    </Suspense>
  );
};

export default PaymentReturnRoute;
