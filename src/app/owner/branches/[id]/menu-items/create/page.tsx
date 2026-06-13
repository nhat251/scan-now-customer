import { ProtectedRoute } from "@/components/auth/protected-route";
import { MenuItemFormPage } from "@/components/manage-menu/menu-item-form-page";

type Props = {
  params: Promise<{ id: string }>;
};

const OwnerMenuItemCreateRoute = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <MenuItemFormPage branchId={id} mode="create" portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerMenuItemCreateRoute;
