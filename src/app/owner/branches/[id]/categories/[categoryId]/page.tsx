import { ProtectedRoute } from "@/components/auth/protected-route";
import { CategoryFormPage } from "@/components/manage-menu/category-form-page";

type Props = {
  params: Promise<{ id: string; categoryId: string }>;
};

const OwnerCategoryDetailRoute = async ({ params }: Props) => {
  const { id, categoryId } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <CategoryFormPage branchId={id} categoryId={categoryId} mode="edit" portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerCategoryDetailRoute;
