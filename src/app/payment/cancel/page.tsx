import { Suspense } from "react";

import { PaymentResultPage } from "@/components/customer/payment-result-page";

const PaymentCancelRoute = () => {
  return (
    <Suspense fallback={null}>
      <PaymentResultPage result="cancel" />
    </Suspense>
  );
};

export default PaymentCancelRoute;
