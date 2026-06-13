import { ProtectedRoute } from "@/components/auth/protected-route";
import { CategoryFormPage } from "@/components/manage-menu/category-form-page";

type Props = {
  params: Promise<{ id: string }>;
};

const OwnerCategoryCreateRoute = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <CategoryFormPage branchId={id} mode="create" portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerCategoryCreateRoute;
