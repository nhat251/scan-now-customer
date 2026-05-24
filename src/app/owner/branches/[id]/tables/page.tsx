import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerTableListPage } from "@/components/owner/tables/owner-table-list-page";

type OwnerBranchTablesRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const OwnerBranchTablesRoute = async ({ params }: OwnerBranchTablesRouteProps) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerTableListPage branchId={id} />
    </ProtectedRoute>
  );
};

export default OwnerBranchTablesRoute;
