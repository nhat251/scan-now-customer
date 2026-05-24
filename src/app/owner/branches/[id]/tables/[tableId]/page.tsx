import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerTableDetailPage } from "@/components/owner/tables/owner-table-detail-page";

type OwnerBranchTableDetailRouteProps = {
  params: Promise<{
    id: string;
    tableId: string;
  }>;
};

const OwnerBranchTableDetailRoute = async ({ params }: OwnerBranchTableDetailRouteProps) => {
  const { id, tableId } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerTableDetailPage branchId={id} tableId={tableId} />
    </ProtectedRoute>
  );
};

export default OwnerBranchTableDetailRoute;
