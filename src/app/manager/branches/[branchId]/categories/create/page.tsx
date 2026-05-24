import { ProtectedRoute } from "@/components/auth/protected-route";
import { CategoryFormPage } from "@/components/manage-menu/category-form-page";

type Props = {
  params: Promise<{ branchId: string }>;
};

const ManagerCategoryCreateRoute = async ({ params }: Props) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <CategoryFormPage branchId={branchId} mode="create" portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerCategoryCreateRoute;
