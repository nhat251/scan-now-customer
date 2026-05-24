import { ProtectedRoute } from "@/components/auth/protected-route";
import { KITCHEN_ORDER_ROLES } from "@/components/me/helpers";
import { MyBranchKitchenPage } from "@/components/me/my-branch-kitchen-page";

type Props = {
  params: Promise<{
    branchId: string;
  }>;
};

const MyBranchKitchenRoute = async ({ params }: Props) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...KITCHEN_ORDER_ROLES]}>
      <MyBranchKitchenPage branchId={branchId} />
    </ProtectedRoute>
  );
};

export default MyBranchKitchenRoute;
