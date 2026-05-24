import { SessionCheckoutPage } from "@/components/customer/session-checkout-page";

type Props = {
  params: Promise<{
    sessionCode: string;
  }>;
};

const PublicSessionCheckoutRoute = async ({ params }: Props) => {
  const { sessionCode } = await params;

  return <SessionCheckoutPage sessionCode={decodeURIComponent(sessionCode)} />;
};

export default PublicSessionCheckoutRoute;
