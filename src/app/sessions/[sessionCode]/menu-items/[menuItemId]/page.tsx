import { SessionMenuItemPage } from "@/components/customer/session-menu-item-page";

type Props = {
  params: Promise<{
    sessionCode: string;
    menuItemId: string;
  }>;
};

const PublicSessionMenuItemRoute = async ({ params }: Props) => {
  const { sessionCode, menuItemId } = await params;

  return <SessionMenuItemPage sessionCode={decodeURIComponent(sessionCode)} menuItemId={decodeURIComponent(menuItemId)} />;
};

export default PublicSessionMenuItemRoute;
