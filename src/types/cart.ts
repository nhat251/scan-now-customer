export type CartItemDto = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  specialRequest?: string | null;
  imageUrl?: string | null;
};

export type CartDto = {
  items: CartItemDto[];
  totalAmount: number;
};

export const EMPTY_CART: CartDto = {
  items: [],
  totalAmount: 0,
};
