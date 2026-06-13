import { SessionMenuPageClient } from "@/components/customer/session-menu-page-client";

type SessionMenuRouteProps = {
  params: Promise<{
    sessionCode: string;
  }>;
};

const SessionMenuRoute = async ({ params }: SessionMenuRouteProps) => {
  const { sessionCode } = await params;

  return <SessionMenuPageClient sessionCode={sessionCode} />;
};

export default SessionMenuRoute;
