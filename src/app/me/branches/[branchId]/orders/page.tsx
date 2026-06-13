import { ProtectedRoute } from "@/components/auth/protected-route";
import { WAITER_ORDER_ROLES } from "@/components/me/helpers";
import { MyBranchOrdersPage } from "@/components/me/my-branch-orders-page";

type Props = {
  params: Promise<{
    branchId: string;
  }>;
};

const MyBranchOrdersRoute = async ({ params }: Props) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...WAITER_ORDER_ROLES]}>
      <MyBranchOrdersPage branchId={branchId} />
    </ProtectedRoute>
  );
};

export default MyBranchOrdersRoute;
