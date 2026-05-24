import { ProtectedRoute } from "@/components/auth/protected-route";
import { MenuItemListPage } from "@/components/manage-menu/menu-item-list-page";

type Props = {
  params: Promise<{ id: string }>;
};

const OwnerMenuItemsRoute = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <MenuItemListPage branchId={id} portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerMenuItemsRoute;
