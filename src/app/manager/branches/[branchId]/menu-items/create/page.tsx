import { ProtectedRoute } from "@/components/auth/protected-route";
import { MenuItemFormPage } from "@/components/manage-menu/menu-item-form-page";

type Props = {
  params: Promise<{ branchId: string }>;
};

const ManagerMenuItemCreateRoute = async ({ params }: Props) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <MenuItemFormPage branchId={branchId} mode="create" portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerMenuItemCreateRoute;
