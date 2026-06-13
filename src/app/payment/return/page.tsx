import { Suspense } from "react";

import { PaymentResultPage } from "@/components/customer/payment-result-page";

const PaymentReturnRoute = () => {
  return (
    <Suspense fallback={null}>
      <PaymentResultPage result="return" />
    </Suspense>
  );
};

export default PaymentReturnRoute;
