import { ProtectedRoute } from "@/components/auth/protected-route";
import { CategoryListPage } from "@/components/manage-menu/category-list-page";

type Props = {
  params: Promise<{ branchId: string }>;
};

const ManagerBranchCategoriesRoute = async ({ params }: Props) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <CategoryListPage branchId={branchId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerBranchCategoriesRoute;
