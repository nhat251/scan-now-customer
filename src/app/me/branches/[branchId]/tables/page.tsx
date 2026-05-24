import { ProtectedRoute } from "@/components/auth/protected-route";
import { STAFF_TABLE_ROLES } from "@/components/me/helpers";
import { MyBranchTablesPage } from "@/components/me/my-branch-tables-page";

type MyBranchTablesRouteProps = {
  params: Promise<{
    branchId: string;
  }>;
};

const MyBranchTablesRoute = async ({ params }: MyBranchTablesRouteProps) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...STAFF_TABLE_ROLES]}>
      <MyBranchTablesPage branchId={branchId} />
    </ProtectedRoute>
  );
};

export default MyBranchTablesRoute;
