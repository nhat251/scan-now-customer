"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, History, ImageIcon, Save, Upload } from "lucide-react";

import { PortalShell } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateManageMenuItemMutation,
  useUpdateManageMenuItemMutation,
  useUploadManageMenuItemImagesMutation,
} from "@/hooks/mutations/useManageMenuMutations";
import { useManageCategoriesQuery, useManageMenuItemQuery } from "@/hooks/queries/useManageMenuQueries";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { ManageMenuItemFormValues } from "@/types/manage-menu";

import {
  emptyMenuItemForm,
  getManageApiErrorMessage,
  getManageMenuNavItems,
  getMenuItemListPath,
  getPortalCopy,
  getPriceHistoryPath,
  isForbiddenError,
  isValidOptionalUrl,
  type ManagePortal,
  toMenuItemFormValues,
} from "./helpers";
import { UpdatePriceDialog } from "./update-price-dialog";

type MenuItemFormPageProps = {
  branchId?: string;
  menuItemId?: string;
  mode: "create" | "edit";
  portal: ManagePortal;
};

const toCreatePayload = (value: ManageMenuItemFormValues) => ({
  name: value.name.trim(),
  description: value.description.trim() || null,
  imageUrl: value.imageUrl.trim() || null,
  price: Number(value.price || 0),
  costPrice: Number(value.costPrice || 0),
  preparationTime: Number(value.preparationTime || 0),
  displayOrder: Number(value.displayOrder || 0),
  isAvailable: value.isAvailable,
  isFeatured: value.isFeatured,
});

const toUpdatePayload = (value: ManageMenuItemFormValues) => ({
  ...toCreatePayload(value),
  categoryId: value.categoryId,
});

export const MenuItemFormPage = ({ branchId: initialBranchId, menuItemId, mode, portal }: MenuItemFormPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const itemQuery = useManageMenuItemQuery(menuItemId, mode === "edit");
  const branchId = initialBranchId ?? itemQuery.data?.branchId;
  const categoriesQuery = useManageCategoriesQuery(
    branchId,
    { pageNumber: 1, pageSize: 100, isActive: true, sortBy: "displayOrder", sortDirection: "asc" },
    Boolean(branchId)
  );
  const createMutation = useCreateManageMenuItemMutation();
  const updateMutation = useUpdateManageMenuItemMutation();
  const uploadImageMutation = useUploadManageMenuItemImagesMutation();
  const [form, setForm] = useState<ManageMenuItemFormValues>(emptyMenuItemForm);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  const categories = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items]);

  useEffect(() => {
    if (mode === "edit" && itemQuery.data) {
      setForm(toMenuItemFormValues(itemQuery.data));
    }
  }, [itemQuery.data, mode]);

  useEffect(() => {
    if (mode === "create" && !form.categoryId && categories[0]) {
      setForm((current) => ({ ...current, categoryId: categories[0].categoryId }));
    }
  }, [categories, form.categoryId, mode]);

  const onChange = <Key extends keyof ManageMenuItemFormValues>(field: Key, value: ManageMenuItemFormValues[Key]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!form.categoryId) {
      showNotify({ type: "warning", message: "Category is required." });
      return false;
    }

    if (!form.name.trim()) {
      showNotify({ type: "warning", message: "Name is required." });
      return false;
    }

    if (mode === "create" && Number(form.price) < 0) {
      showNotify({ type: "warning", message: "Price must be greater than or equal to 0." });
      return false;
    }

    if (Number(form.costPrice) < 0 || Number(form.preparationTime) < 0 || Number(form.displayOrder) < 0) {
      showNotify({ type: "warning", message: "Numeric values must be greater than or equal to 0." });
      return false;
    }

    if (!isValidOptionalUrl(form.imageUrl)) {
      showNotify({ type: "warning", message: "Image URL must be a valid URL." });
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!branchId || !validate()) {
      return;
    }

    if (mode === "create") {
      await createMutation.mutateAsync({ branchId, categoryId: form.categoryId, data: toCreatePayload(form) });
      router.push(getMenuItemListPath(portal, branchId));
      return;
    }

    if (menuItemId) {
      await updateMutation.mutateAsync({ menuItemId, data: toUpdatePayload(form) });
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showNotify({ type: "warning", message: "Please choose an image file." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotify({ type: "warning", message: "Image must be 5MB or smaller." });
      return;
    }

    const response = await uploadImageMutation.mutateAsync([file]);
    const imageUrl = response.result[0];

    if (imageUrl) {
      onChange("imageUrl", imageUrl);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending;

  return (
    <PortalShell
      title={mode === "create" ? "Create Menu Item" : itemQuery.data?.name ?? "Menu Item Detail"}
      description="Manage item content, category, cost, preparation time, ordering, and flags."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "menu-items", branchId)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        branchId ? (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push(getMenuItemListPath(portal, branchId))}>
              <ArrowLeft className="size-4" />
              Menu Items
            </Button>
            {mode === "edit" && menuItemId && itemQuery.data ? (
              <>
                <Button onClick={() => setPriceDialogOpen(true)}>
                  <DollarSign className="size-4" />
                  Update Price
                </Button>
                <Button asChild variant="outline">
                  <Link href={getPriceHistoryPath(portal, menuItemId)}>
                    <History className="size-4" />
                    Price History
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        ) : null
      }
    >
      {itemQuery.isError || categoriesQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(itemQuery.error) || isForbiddenError(categoriesQuery.error)
            ? "You do not have permission to access this branch"
            : getManageApiErrorMessage(itemQuery.error ?? categoriesQuery.error, "Unable to load menu item data.")}
        </div>
      ) : null}

      <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Category</span>
            <select
              value={form.categoryId}
              onChange={(event) => onChange("categoryId", event.target.value)}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-3"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Name</span>
            <Input value={form.name} onChange={(event) => onChange("name", event.target.value)} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Image URL</span>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Input value={form.imageUrl} onChange={(event) => onChange("imageUrl", event.target.value)} />
              <Button asChild variant="outline" className="relative overflow-hidden">
                <span>
                  <Upload className="size-4" />
                  {uploadImageMutation.isPending ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={uploadImageMutation.isPending}
                    onChange={(event) => {
                      void handleImageUpload(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </span>
              </Button>
            </div>
            {form.imageUrl ? (
              <div className="border-border/60 bg-surface-container-low mt-3 flex items-center gap-3 rounded-xl border p-3">
                <div className="relative size-16 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={form.imageUrl}
                    alt="Menu item preview"
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">Current image</p>
                  <p className="text-muted-foreground truncate">{form.imageUrl}</p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground bg-surface-container-low mt-3 flex items-center gap-2 rounded-xl p-3 text-sm">
                <ImageIcon className="size-4" />
                No image selected.
              </div>
            )}
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <Textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Price</span>
            <Input
              disabled={mode === "edit"}
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => onChange("price", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Cost Price</span>
            <Input type="number" min={0} value={form.costPrice} onChange={(event) => onChange("costPrice", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Preparation Time</span>
            <Input type="number" min={0} value={form.preparationTime} onChange={(event) => onChange("preparationTime", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Display Order</span>
            <Input type="number" min={0} value={form.displayOrder} onChange={(event) => onChange("displayOrder", event.target.value)} />
          </label>
          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold">
            <input type="checkbox" checked={form.isAvailable} onChange={(event) => onChange("isAvailable", event.target.checked)} />
            Available
          </label>
          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold">
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => onChange("isFeatured", event.target.checked)} />
            Featured
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={submit} disabled={isSubmitting || categories.length === 0}>
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Save Menu Item"}
          </Button>
        </div>
      </section>

      {mode === "edit" && menuItemId && itemQuery.data ? (
        <UpdatePriceDialog
          menuItemId={menuItemId}
          currentPrice={itemQuery.data.price}
          open={priceDialogOpen}
          onOpenChange={setPriceDialogOpen}
        />
      ) : null}
    </PortalShell>
  );
};
