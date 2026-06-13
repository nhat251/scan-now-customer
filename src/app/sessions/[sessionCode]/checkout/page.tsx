import { SessionCheckoutPageClient } from "@/components/customer/session-checkout-page-client";

type SessionCheckoutRouteProps = {
  params: Promise<{
    sessionCode: string;
  }>;
};

const SessionCheckoutRoute = async ({ params }: SessionCheckoutRouteProps) => {
  const { sessionCode } = await params;

  return <SessionCheckoutPageClient sessionCode={sessionCode} />;
};

export default SessionCheckoutRoute;
