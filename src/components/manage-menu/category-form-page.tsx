"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { PortalShell } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateManageCategoryMutation, useUpdateManageCategoryMutation } from "@/hooks/mutations/useManageMenuMutations";
import { useManageCategoryQuery } from "@/hooks/queries/useManageMenuQueries";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { ManageCategoryFormValues } from "@/types/manage-menu";

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

export const CategoryFormPage = ({ branchId, categoryId, mode, portal }: CategoryFormPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const categoryQuery = useManageCategoryQuery(branchId, categoryId, mode === "edit");
  const createMutation = useCreateManageCategoryMutation();
  const updateMutation = useUpdateManageCategoryMutation();
  const [form, setForm] = useState<ManageCategoryFormValues>(emptyCategoryForm);

  useEffect(() => {
    if (mode === "edit" && categoryQuery.data) {
      setForm(toCategoryFormValues(categoryQuery.data));
    }
  }, [categoryQuery.data, mode]);

  const onChange = (field: keyof ManageCategoryFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      showNotify({ type: "warning", message: "Category name is required." });
      return false;
    }

    if (Number(form.displayOrder) < 0) {
      showNotify({ type: "warning", message: "Display order must be greater than or equal to 0." });
      return false;
    }

    if (!isValidOptionalUrl(form.imageUrl)) {
      showNotify({ type: "warning", message: "Image URL must be a valid URL." });
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    if (mode === "create") {
      await createMutation.mutateAsync({ branchId, data: toPayload(form) });
      router.push(getCategoryListPath(portal, branchId));
      return;
    }

    if (categoryId) {
      await updateMutation.mutateAsync({ branchId, categoryId, data: toPayload(form) });
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
          <label className="space-y-2">
            <span className="text-sm font-semibold">Category name</span>
            <Input value={form.name} onChange={(event) => onChange("name", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Display order</span>
            <Input
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(event) => onChange("displayOrder", event.target.value)}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Image URL</span>
            <Input value={form.imageUrl} onChange={(event) => onChange("imageUrl", event.target.value)} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <Textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={submit} disabled={isSubmitting}>
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </section>
    </PortalShell>
  );
};
