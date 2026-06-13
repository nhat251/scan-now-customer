"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign, History, ImageIcon, Save, Upload } from "lucide-react";
import type { FieldErrors} from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
import { zodResolver } from "@hookform/resolvers/zod";

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

const getMenuItemSchema = (mode: "create" | "edit") =>
  z.object({
    categoryId: z.string().min(1, "Category is required."),
    name: z.string().trim().min(1, "Name is required."),
    imageUrl: z.string().refine(
      (val) => !val || isValidOptionalUrl(val),
      { message: "Image URL must be a valid URL." }
    ),
    description: z.string(),
    price: mode === "create"
      ? z.string().refine((val) => Number(val) >= 0, { message: "Price must be greater than or equal to 0." })
      : z.string(),
    costPrice: z.string().refine((val) => Number(val) >= 0, { message: "Numeric values must be greater than or equal to 0." }),
    preparationTime: z.string().refine((val) => Number(val) >= 0, { message: "Numeric values must be greater than or equal to 0." }),
    displayOrder: z.string().refine((val) => Number(val) >= 0, { message: "Numeric values must be greater than or equal to 0." }),
    isAvailable: z.boolean(),
    isFeatured: z.boolean(),
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
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const categories = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items]);

  const { register, control, handleSubmit, reset, setValue } = useForm<ManageMenuItemFormValues>({
    resolver: zodResolver(getMenuItemSchema(mode)),
    defaultValues: emptyMenuItemForm,
  });

  const categoryIdValue = useWatch({ control, name: "categoryId" });
  const imageUrlValue = useWatch({ control, name: "imageUrl" });

  useEffect(() => {
    if (mode === "edit" && itemQuery.data) {
      reset(toMenuItemFormValues(itemQuery.data));
    }
  }, [itemQuery.data, mode, reset]);

  useEffect(() => {
    if (mode === "create" && !categoryIdValue && categories[0]) {
      setValue("categoryId", categories[0].categoryId);
    }
  }, [categories, categoryIdValue, mode, setValue]);

  const submit = async (values: ManageMenuItemFormValues) => {
    if (!branchId) {
      return;
    }

    if (mode === "create") {
      await createMutation.mutateAsync({ branchId, categoryId: values.categoryId, data: toCreatePayload(values) });
      router.push(getMenuItemListPath(portal, branchId));
      return;
    }

    if (menuItemId) {
      await updateMutation.mutateAsync({ menuItemId, data: toUpdatePayload(values) });
    }
  };

  const onValidationError = (errors: FieldErrors<ManageMenuItemFormValues>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      showNotify({ type: "warning", message: firstError.message });
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
      setValue("imageUrl", imageUrl);
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
            <span className="text-sm font-semibold">
              Category <span className="text-destructive">*</span>
            </span>
            <select
              {...register("categoryId")}
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
            <span className="text-sm font-semibold">
              Name <span className="text-destructive">*</span>
            </span>
            <Input {...register("name")} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold">Image URL</span>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <Input {...register("imageUrl")} />
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
            {imageUrlValue ? (
              <div className="border-border/60 bg-surface-container-low mt-3 flex items-center gap-3 rounded-xl border p-3">
                <div className="relative size-16 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={imageUrlValue}
                    alt="Menu item preview"
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">Current image</p>
                  <p className="text-muted-foreground truncate">{imageUrlValue}</p>
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
            <Textarea {...register("description")} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">
              Price {mode === "create" && <span className="text-destructive">*</span>}
            </span>
            <Input
              disabled={mode === "edit"}
              type="number"
              min={0}
              {...register("price")}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Cost Price</span>
            <Input type="number" min={0} {...register("costPrice")} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Preparation Time</span>
            <Input type="number" min={0} {...register("preparationTime")} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Display Order</span>
            <Input type="number" min={0} {...register("displayOrder")} />
          </label>
          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold">
            <input type="checkbox" {...register("isAvailable")} />
            Available
          </label>
          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold">
            <input type="checkbox" {...register("isFeatured")} />
            Featured
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit(submit, onValidationError)} disabled={isSubmitting || categories.length === 0}>
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
