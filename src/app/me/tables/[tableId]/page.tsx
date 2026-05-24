import { ProtectedRoute } from "@/components/auth/protected-route";
import { STAFF_TABLE_ROLES } from "@/components/me/helpers";
import { MyTableDetailPage } from "@/components/me/my-table-detail-page";

type MyTableDetailRouteProps = {
  params: Promise<{
    tableId: string;
  }>;
};

const MyTableDetailRoute = async ({ params }: MyTableDetailRouteProps) => {
  const { tableId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...STAFF_TABLE_ROLES]}>
      <MyTableDetailPage tableId={tableId} />
    </ProtectedRoute>
  );
};

export default MyTableDetailRoute;
