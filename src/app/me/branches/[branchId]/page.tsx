import { ProtectedRoute } from "@/components/auth/protected-route";
import { MY_BRANCH_ROLES } from "@/components/me/helpers";
import { MyBranchDetailPage } from "@/components/me/my-branch-detail-page";

type MyBranchDetailRouteProps = {
  params: Promise<{
    branchId: string;
  }>;
};

const MyBranchDetailRoute = async ({ params }: MyBranchDetailRouteProps) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...MY_BRANCH_ROLES]}>
      <MyBranchDetailPage branchId={branchId} />
    </ProtectedRoute>
  );
};

export default MyBranchDetailRoute;
