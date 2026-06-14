import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
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
  uploadManageMenuItemImages,
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
      showNotify({ type: "success", message: "Đã tạo danh mục." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo danh mục."),
      }),
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
      showNotify({ type: "success", message: "Đã cập nhật danh mục." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật danh mục."),
      }),
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
      showNotify({ type: "success", message: "Đã cập nhật trạng thái danh mục." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật trạng thái danh mục."),
      }),
  });
};

export const useReorderManageCategoriesMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; data: ReorderRequest },
    ApiResponse<ManageCategoryResponse[]>
  >({
    mutationFn: async (payload) => (await reorderManageCategories(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã sắp xếp lại danh mục." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể sắp xếp lại danh mục."),
      }),
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
      showNotify({ type: "success", message: "Đã tạo món." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo món."),
      }),
  });
};

export const useUpdateManageMenuItemMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { menuItemId: string; data: UpdateMenuItemRequest },
    ApiResponse<ManageMenuItemResponse>
  >({
    mutationFn: async (payload) => (await updateManageMenuItem(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật món." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật món."),
      }),
  });
};

export const useUploadManageMenuItemImagesMutation = () => {
  return useMutation<File[], ApiResponse<string[]>>({
    mutationFn: async (files) => (await uploadManageMenuItemImages(files)).data,
    hasLoading: true,
    onSuccess: () => {
      showNotify({ type: "success", message: "Đã tải hình ảnh lên." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải hình ảnh lên."),
      }),
  });
};

export const useSetManageMenuItemActiveMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { menuItemId: string; isActive: boolean },
    ApiResponse<ManageMenuItemResponse>
  >({
    mutationFn: async (payload) => (await setManageMenuItemActive(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật trạng thái món." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật trạng thái món."),
      }),
  });
};

export const useReorderManageMenuItemsMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; data: ReorderRequest },
    ApiResponse<ManageMenuItemResponse[]>
  >({
    mutationFn: async (payload) => (await reorderManageMenuItems(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã sắp xếp lại món." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể sắp xếp lại món."),
      }),
  });
};

export const useToggleManageMenuItemAvailableMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<string, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (menuItemId) => (await toggleManageMenuItemAvailable(menuItemId)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật tình trạng phục vụ." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật tình trạng phục vụ."),
      }),
  });
};

export const useBulkManageAvailabilityMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { branchId: string; data: BulkAvailabilityRequest },
    ApiResponse<ManageMenuItemResponse[]>
  >({
    mutationFn: async (payload) => (await bulkManageAvailability(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật các món đã chọn." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật các món đã chọn."),
      }),
  });
};

export const useToggleManageMenuItemFeaturedMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<string, ApiResponse<ManageMenuItemResponse>>({
    mutationFn: async (menuItemId) => (await toggleManageMenuItemFeatured(menuItemId)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật trạng thái nổi bật." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật trạng thái nổi bật."),
      }),
  });
};

export const useUpdateManageMenuItemPriceMutation = () => {
  const { refresh } = useRefreshManageMenu();

  return useMutation<
    { menuItemId: string; data: UpdatePriceRequest },
    ApiResponse<ManageMenuItemResponse>
  >({
    mutationFn: async (payload) => (await updateManageMenuItemPrice(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật giá." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật giá."),
      }),
  });
};
