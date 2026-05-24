import { ProtectedRoute } from "@/components/auth/protected-route";
import { CategoryFormPage } from "@/components/manage-menu/category-form-page";

type Props = {
  params: Promise<{ branchId: string; categoryId: string }>;
};

const ManagerCategoryDetailRoute = async ({ params }: Props) => {
  const { branchId, categoryId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <CategoryFormPage branchId={branchId} categoryId={categoryId} mode="edit" portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerCategoryDetailRoute;
