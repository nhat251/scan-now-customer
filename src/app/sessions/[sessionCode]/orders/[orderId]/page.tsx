import { SessionOrderPage } from "@/components/customer/session-order-page";

type Props = {
  params: Promise<{
    sessionCode: string;
    orderId: string;
  }>;
};

const PublicSessionOrderRoute = async ({ params }: Props) => {
  const { sessionCode, orderId } = await params;

  return (
    <SessionOrderPage
      sessionCode={decodeURIComponent(sessionCode)}
      orderId={decodeURIComponent(orderId)}
    />
  );
};

export default PublicSessionOrderRoute;
