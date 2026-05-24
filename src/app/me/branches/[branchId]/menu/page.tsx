import { ProtectedRoute } from "@/components/auth/protected-route";
import { STAFF_MENU_ROLES } from "@/components/me/helpers";
import { MyBranchMenuPage } from "@/components/me/my-branch-menu-page";

type MyBranchMenuRouteProps = {
  params: Promise<{
    branchId: string;
  }>;
};

const MyBranchMenuRoute = async ({ params }: MyBranchMenuRouteProps) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={[...STAFF_MENU_ROLES]}>
      <MyBranchMenuPage branchId={branchId} />
    </ProtectedRoute>
  );
};

export default MyBranchMenuRoute;
