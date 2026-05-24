import { ProtectedRoute } from "@/components/auth/protected-route";
import { CategoryListPage } from "@/components/manage-menu/category-list-page";

type Props = {
  params: Promise<{ id: string }>;
};

const OwnerBranchCategoriesRoute = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <CategoryListPage branchId={id} portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerBranchCategoriesRoute;
