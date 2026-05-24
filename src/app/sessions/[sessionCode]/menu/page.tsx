import { SessionMenuPage } from "@/components/customer/session-menu-page";

type Props = {
  params: Promise<{
    sessionCode: string;
  }>;
};

const PublicSessionMenuRoute = async ({ params }: Props) => {
  const { sessionCode } = await params;

  return <SessionMenuPage sessionCode={decodeURIComponent(sessionCode)} />;
};

export default PublicSessionMenuRoute;
