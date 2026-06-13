import { ProtectedRoute } from "@/components/auth/protected-route";
import { MenuItemFormPage } from "@/components/manage-menu/menu-item-form-page";

type Props = {
  params: Promise<{ menuItemId: string }>;
};

const ManagerMenuItemDetailRoute = async ({ params }: Props) => {
  const { menuItemId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <MenuItemFormPage menuItemId={menuItemId} mode="edit" portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerMenuItemDetailRoute;
