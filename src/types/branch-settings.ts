export type PaymentMethod = "CASH" | "PAYOS";
export type DiscountType = "PERCENT" | "FIXED_AMOUNT";

export type BranchPaymentConfigResponse = {
  paymentConfigId: string | null;
  branchId: string;
  cashEnabled: boolean;
  payOsEnabled: boolean;
  hasPayOsClientId: boolean;
  hasPayOsApiKey: boolean;
  hasPayOsChecksumKey: boolean;
  payOsClientIdPreview: string | null;
  defaultMethod: PaymentMethod;
  updatedAt: string | null;
};

export type UpsertBranchPaymentConfigRequest = {
  cashEnabled: boolean;
  payOsEnabled: boolean;
  payOsClientId?: string | null;
  payOsApiKey?: string | null;
  payOsChecksumKey?: string | null;
  defaultMethod: PaymentMethod;
};

export type PaperVoucherResponse = {
  voucherId: string;
  branchId: string;
  code: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  quantity: number;
  usedCount: number;
  remainingCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  qrPayload: string;
  createdAt: string;
  updatedAt: string | null;
};

export type PaperVoucherRequest = {
  code: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  quantity: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
};
