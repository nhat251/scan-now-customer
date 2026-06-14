import type {
  MyMenuCategoryResponse,
  MyMenuItemResponse,
} from "@/types/me";

export type ManualOrderCartItem = {
  menuItem: MyMenuItemResponse;
  qty: number;
};

export const getManualOrderMenuItems = (
  categories: MyMenuCategoryResponse[],
  activeCategory: string,
  search: string
) => {
  const normalizedSearch = search.trim().toLowerCase();
  const flattened = categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryName: category.categoryName,
    }))
  );

  return flattened.filter((item) => {
    const matchesCategory =
      activeCategory === "all" ||
      item.categoryId === activeCategory ||
      item.categoryName === activeCategory;
    const matchesSearch =
      !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      (item.description ?? "").toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
};

export const getManualOrderCategoryOptions = (
  categories: MyMenuCategoryResponse[]
) =>
  categories.map((category) => ({
    id: category.categoryId,
    name: category.categoryName,
  }));

export const getManualOrderCartTotal = (items: ManualOrderCartItem[]) =>
  items.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);

export const addManualOrderCartItem = (
  items: ManualOrderCartItem[],
  menuItem: MyMenuItemResponse
) => {
  const existing = items.find(
    (item) => item.menuItem.menuItemId === menuItem.menuItemId
  );
  if (!existing) {
    return [...items, { menuItem, qty: 1 }];
  }

  return items.map((item) =>
    item.menuItem.menuItemId === menuItem.menuItemId
      ? { ...item, qty: item.qty + 1 }
      : item
  );
};

export const updateManualOrderCartItemQuantity = (
  items: ManualOrderCartItem[],
  menuItemId: string,
  delta: number
) =>
  items
    .map((item) =>
      item.menuItem.menuItemId === menuItemId
        ? { ...item, qty: item.qty + delta }
        : item
    )
    .filter((item) => item.qty > 0);
