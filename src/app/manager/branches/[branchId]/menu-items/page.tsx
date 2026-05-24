import { ProtectedRoute } from "@/components/auth/protected-route";
import { MenuItemListPage } from "@/components/manage-menu/menu-item-list-page";

type Props = {
  params: Promise<{ branchId: string }>;
};

const ManagerMenuItemsRoute = async ({ params }: Props) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <MenuItemListPage branchId={branchId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerMenuItemsRoute;
