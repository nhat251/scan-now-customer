import { ProtectedRoute } from "@/components/auth/protected-route";
import { PriceHistoryPage } from "@/components/manage-menu/price-history-page";

type Props = {
  params: Promise<{ menuItemId: string }>;
};

const ManagerPriceHistoryRoute = async ({ params }: Props) => {
  const { menuItemId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <PriceHistoryPage menuItemId={menuItemId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerPriceHistoryRoute;
