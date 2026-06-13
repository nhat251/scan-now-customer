"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import type { FieldErrors} from "react-hook-form";
import {useForm } from "react-hook-form";
import { z } from "zod";

import { PortalShell } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateManageCategoryMutation, useUpdateManageCategoryMutation } from "@/hooks/mutations/useManageMenuMutations";
import { useManageCategoryQuery } from "@/hooks/queries/useManageMenuQueries";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { ManageCategoryFormValues } from "@/types/manage-menu";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  emptyCategoryForm,
  getCategoryListPath,
  getManageApiErrorMessage,
  getManageMenuNavItems,
  getPortalCopy,
  isForbiddenError,
  isValidOptionalUrl,
  type ManagePortal,
  toCategoryFormValues,
} from "./helpers";

type CategoryFormPageProps = {
  branchId: string;
  categoryId?: string;
  mode: "create" | "edit";
  portal: ManagePortal;
};

const toPayload = (value: ManageCategoryFormValues) => ({
  name: value.name.trim(),
  description: value.description.trim() || null,
  imageUrl: value.imageUrl.trim() || null,
  displayOrder: Number(value.displayOrder || 0),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  displayOrder: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Display order must be greater than or equal to 0." }
  ),
  imageUrl: z.string().refine(
    (val) => !val || isValidOptionalUrl(val),
    { message: "Image URL must be a valid URL." }
  ),
  description: z.string(),
});

export const CategoryFormPage = ({ branchId, categoryId, mode, portal }: CategoryFormPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const categoryQuery = useManageCategoryQuery(branchId, categoryId, mode === "edit");
  const createMutation = useCreateManageCategoryMutation();
  const updateMutation = useUpdateManageCategoryMutation();

  const { register, handleSubmit, reset } = useForm<ManageCategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyCategoryForm,
  });

  useEffect(() => {
    if (mode === "edit" && categoryQuery.data) {
      reset(toCategoryFormValues(categoryQuery.data));
    }
  }, [categoryQuery.data, mode, reset]);

  const submit = async (values: ManageCategoryFormValues) => {
    if (mode === "create") {
      await createMutation.mutateAsync({ branchId, data: toPayload(values) });
      router.push(getCategoryListPath(portal, branchId));
      return;
    }

    if (categoryId) {
      await updateMutation.mutateAsync({ branchId, categoryId, data: toPayload(values) });
    }
  };

  const onValidationError = (errors: FieldErrors<ManageCategoryFormValues>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      showNotify({ type: "warning", message: firstError.message });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const title = mode === "create" ? "Create Category" : categoryQuery.data?.name ?? "Category Detail";

  return (
    <PortalShell
      title={title}
      description="Manage category identity, ordering, and display image."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "categories", branchId)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <Button variant="outline" onClick={() => router.push(getCategoryListPath(portal, branchId))}>
          <ArrowLeft className="size-4" />
          Categories
        </Button>
      }
    >
      {categoryQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(categoryQuery.error)
            ? "You do not have permission to access this branch"
            : getManageApiErrorMessage(categoryQuery.error, "Unable to load category.")}
        </div>
      ) : null}

      <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category-name" required>
              Category name
            </Label>
            <Input id="category-name" {...register("name")} />
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Display order</span>
            <Input
              type="number"
              min={0}
              {...register("displayOrder")}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Image URL</span>
            <Input {...register("imageUrl")} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <Textarea {...register("description")} />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit(submit, onValidationError)} disabled={isSubmitting}>
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </section>
    </PortalShell>
  );
};
