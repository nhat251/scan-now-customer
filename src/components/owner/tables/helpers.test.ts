import { describe, expect, it } from "vitest";

import {
  activeFilterToQuery,
  getActiveLabel,
  getOwnerTablePayload,
  getOwnerTableStatusLabel,
  getQrFileName,
  normalizeOwnerTableStatus,
  toOwnerTableFormValues,
} from "@/components/owner/tables/helpers";

describe("owner table helpers", () => {
  it("normalizes legacy statuses and never exposes raw unknown values", () => {
    expect(normalizeOwnerTableStatus(1)).toBe("OCCUPIED");
    expect(getOwnerTableStatusLabel(0)).toBe("Còn trống");
    expect(getOwnerTableStatusLabel("UNKNOWN" as never)).toBe("Trạng thái bàn không xác định");
    expect(getActiveLabel(true)).toBe("Đang hoạt động");
    expect(getActiveLabel(false)).toBe("Ngừng hoạt động");
  });

  it("builds unchanged query and form payloads", () => {
    expect(activeFilterToQuery("all")).toBeUndefined();
    expect(activeFilterToQuery("active")).toBe(true);
    expect(activeFilterToQuery("inactive")).toBe(false);
    expect(getOwnerTablePayload({ tableNumber: " A01 ", capacity: "4" })).toEqual({
      tableNumber: "A01",
      capacity: 4,
    });
    expect(toOwnerTableFormValues()).toEqual({ tableNumber: "", capacity: "2" });
  });

  it("creates stable QR filenames", () => {
    expect(getQrFileName({ tableId: "table-1", tableNumber: "A01" })).toBe(
      "scannow-table-A01-qr.png"
    );
  });
});
