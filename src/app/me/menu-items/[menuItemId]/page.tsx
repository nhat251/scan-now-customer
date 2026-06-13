import { ProtectedRoute } from "@/components/auth/protected-route";
import { STAFF_MENU_ROLES } from "@/components/me/helpers";
import { MyMenuItemDetailPage } from "@/components/me/my-menu-item-detail-page";

type MyMenuItemDetailRouteProps = {
  params: Promise<{
    menuItemId: string;
  }>;
};

const MyMenuItemDetailRoute = async ({ params }: MyMenuItemDetailRouteProps) => {
  const { menuItemId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...STAFF_MENU_ROLES]}>
      <MyMenuItemDetailPage menuItemId={menuItemId} />
    </ProtectedRoute>
  );
};

export default MyMenuItemDetailRoute;
