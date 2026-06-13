import { ProtectedRoute } from "@/components/auth/protected-route";
import { MenuItemFormPage } from "@/components/manage-menu/menu-item-form-page";

type Props = {
  params: Promise<{ menuItemId: string }>;
};

const OwnerMenuItemDetailRoute = async ({ params }: Props) => {
  const { menuItemId } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <MenuItemFormPage menuItemId={menuItemId} mode="edit" portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerMenuItemDetailRoute;
