import { isAxiosError } from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import {
  bulkManageAvailability,
  createManageCategory,
  createManageMenuItem,
  reorderManageCategories,
  reorderManageMenuItems,
  setManageCategoryActive,
  setManageMenuItemActive,
  toggleManageMenuItemAvailable,
  toggleManageMenuItemFeatured,
  updateManageCategory,
  updateManageMenuItem,
  updateManageMenuItemPrice,
} from "@/services/manage-menu";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type {
  BulkAvailabilityRequest,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  ManageCategoryResponse,
  ManageMenuItemResponse,
  ReorderRequest,
  UpdateCategoryRequest,
  UpdateMenuItemRequest,
  UpdatePriceRequest,
} from "@/types/manage-menu";
import { useQueryClient } from "@tanstack/react-query";

const getMutationErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? fallback;
};

const useRefreshManageMenu = () => {
  const queryClient = useQueryClient();

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGE_CATEGORIES] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGE_CATEGORY] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGE_MENU_ITEMS] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGE_MENU_ITEM] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGE_PRICE_HISTORY] });
  };

  return { refresh };
};

export const useCreateManageCategoryMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; data: CreateCategoryRequest },
    ApiResponse<ManageCategoryResponse>
  >({
    mutationFn: async (payload) => (await createManageCategory(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Category created successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to create category.") }),
  });
};

export const useUpdateManageCategoryMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; categoryId: string; data: UpdateCategoryRequest },
    ApiResponse<ManageCategoryResponse>
  >({
    mutationFn: async (payload) => (await updateManageCategory(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Category updated successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update category.") }),
  });
};

export const useSetManageCategoryActiveMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; categoryId: string; isActive: boolean },
    ApiResponse<ManageCategoryResponse>
  >({
    mutationFn: async (payload) => (await setManageCategoryActive(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Category status updated." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update category status.") }),
  });
};

export const useReorderManageCategoriesMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<{ branchId: string; data: ReorderRequest }, ApiResponse<ManageCategoryResponse[]>>({
    mutationFn: async (payload) => (await reorderManageCategories(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Categories reordered successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to reorder categories.") }),
  });
};

export const useCreateManageMenuItemMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; categoryId: string; data: CreateMenuItemRequest },
    ApiResponse<ManageMenuItemResponse>
  >({
    mutationFn: async (payload) => (await createManageMenuItem(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Menu item created successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to create menu item.") }),
  });
};

export const useUpdateManageMenuItemMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<{ menuItemId: string; data: UpdateMenuItemRequest }, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (payload) => (await updateManageMenuItem(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Menu item updated successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update menu item.") }),
  });
};

export const useSetManageMenuItemActiveMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<{ menuItemId: string; isActive: boolean }, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (payload) => (await setManageMenuItemActive(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Menu item status updated." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update item status.") }),
  });
};

export const useReorderManageMenuItemsMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<{ branchId: string; data: ReorderRequest }, ApiResponse<ManageMenuItemResponse[]>>({
    mutationFn: async (payload) => (await reorderManageMenuItems(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Menu items reordered successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to reorder menu items.") }),
  });
};

export const useToggleManageMenuItemAvailableMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<string, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (menuItemId) => (await toggleManageMenuItemAvailable(menuItemId)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Availability updated." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update availability.") }),
  });
};

export const useBulkManageAvailabilityMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<{ branchId: string; data: BulkAvailabilityRequest }, ApiResponse<ManageMenuItemResponse[]>>({
    mutationFn: async (payload) => (await bulkManageAvailability(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Selected items updated." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update selected items.") }),
  });
};

export const useToggleManageMenuItemFeaturedMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<string, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (menuItemId) => (await toggleManageMenuItemFeatured(menuItemId)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Featured status updated." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update featured status.") }),
  });
};

export const useUpdateManageMenuItemPriceMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<{ menuItemId: string; data: UpdatePriceRequest }, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (payload) => (await updateManageMenuItemPrice(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Price updated successfully." });
    },
    onError: (error) => showNotify({ type: "error", message: getMutationErrorMessage(error, "Unable to update price.") }),
  });
};
