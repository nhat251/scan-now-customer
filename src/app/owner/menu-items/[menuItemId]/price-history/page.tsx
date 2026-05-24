import { ProtectedRoute } from "@/components/auth/protected-route";
import { PriceHistoryPage } from "@/components/manage-menu/price-history-page";

type Props = {
  params: Promise<{ menuItemId: string }>;
};

const OwnerPriceHistoryRoute = async ({ params }: Props) => {
  const { menuItemId } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <PriceHistoryPage menuItemId={menuItemId} portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerPriceHistoryRoute;
