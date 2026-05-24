export type OwnerTableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED";

export type OwnerTableSessionResponse = {
  sessionId: string;
  sessionCode: string;
  tableId?: string;
  branchId?: string;
  openedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  expiresAt: string;
  isActive: boolean;
};

export type OwnerTableResponse = {
  tableId: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  capacity: number;
  status: OwnerTableStatus | number;
  isActive: boolean;
  qrCodeToken?: string | null;
  qrCodeUrl?: string | null;
  qrCodeImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  currentSession: OwnerTableSessionResponse | null;
};

export type OwnerTablesQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: OwnerTableStatus;
  capacity?: number;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type CreateOwnerTableRequest = {
  tableNumber: string;
  capacity: number;
};

export type UpdateOwnerTableRequest = {
  tableNumber: string;
  capacity: number;
};

export type UpdateOwnerTableStatusRequest = {
  status: Exclude<OwnerTableStatus, "OCCUPIED">;
};

export type RegenerateOwnerTableQrResponse = {
  qrCodeToken: string;
  qrCodeUrl: string;
};

export type OwnerTableFormValues = {
  tableNumber: string;
  capacity: string;
};
