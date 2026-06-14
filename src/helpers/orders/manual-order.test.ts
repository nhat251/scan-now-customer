import { describe, expect, it } from "vitest";

import {
  addManualOrderCartItem,
  getManualOrderCartTotal,
  getManualOrderCategoryOptions,
  getManualOrderMenuItems,
  updateManualOrderCartItemQuantity,
} from "@/helpers/orders/manual-order";
import { createMenuCategory, createMenuItem } from "@/test/fixtures";

describe("manual order helpers", () => {
  const pho = createMenuItem({
    menuItemId: "pho",
    name: "Phở bò",
    description: "Nước dùng trong",
    price: 50_000,
  });
  const tea = createMenuItem({
    menuItemId: "tea",
    categoryId: "drinks",
    name: "Trà đào",
    price: 30_000,
  });
  const categories = [
    createMenuCategory({ items: [pho] }),
    createMenuCategory({
      categoryId: "drinks",
      categoryName: "Đồ uống",
      items: [tea],
    }),
  ];

  it("filters menu items by category and normalized search", () => {
    expect(getManualOrderMenuItems(categories, "all", "  nước DÙNG ")).toHaveLength(1);
    expect(getManualOrderMenuItems(categories, "drinks", "")).toEqual([
      expect.objectContaining({ menuItemId: "tea", categoryName: "Đồ uống" }),
    ]);
    expect(getManualOrderCategoryOptions(categories)).toEqual([
      { id: "category-1", name: "Món chính" },
      { id: "drinks", name: "Đồ uống" },
    ]);
  });

  it("adds, updates and removes cart quantities without mutating totals", () => {
    const firstCart = addManualOrderCartItem([], pho);
    const secondCart = addManualOrderCartItem(firstCart, pho);
    const mixedCart = addManualOrderCartItem(secondCart, tea);

    expect(firstCart).toEqual([{ menuItem: pho, qty: 1 }]);
    expect(secondCart).toEqual([{ menuItem: pho, qty: 2 }]);
    expect(getManualOrderCartTotal(mixedCart)).toBe(130_000);
    expect(updateManualOrderCartItemQuantity(mixedCart, "pho", -2)).toEqual([
      { menuItem: tea, qty: 1 },
    ]);
  });
});
