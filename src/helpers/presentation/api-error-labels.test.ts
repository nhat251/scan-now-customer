import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { getVietnameseApiErrorMessage } from "@/helpers/presentation";

const createAxiosError = (status: number, data: { code?: string; message?: string }) =>
  new AxiosError("Request failed", undefined, undefined, undefined, {
    config: { headers: new AxiosHeaders() },
    data,
    headers: {},
    status,
    statusText: "Error",
  });

describe("getVietnameseApiErrorMessage", () => {
  it("prioritizes a known backend error code", () => {
    const error = createAxiosError(400, {
      code: "TABLE_OCCUPIED",
      message: "Table is occupied",
    });

    expect(getVietnameseApiErrorMessage(error, "Thao tác thất bại.")).toBe(
      "Bàn này đang có khách."
    );
  });

  it("maps known English backend messages", () => {
    const error = createAxiosError(401, {
      message: "Invalid credentials",
    });

    expect(getVietnameseApiErrorMessage(error, "Đăng nhập thất bại.")).toBe(
      "Tên đăng nhập hoặc mật khẩu không đúng."
    );
  });

  it("maps HTTP status without exposing backend copy", () => {
    const error = createAxiosError(503, {
      message: "Internal dependency timeout",
    });

    expect(getVietnameseApiErrorMessage(error, "Không thể tải dữ liệu.")).toBe(
      "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
    );
  });

  it("returns the Vietnamese action fallback for unknown errors", () => {
    const error = createAxiosError(400, {
      message: "Unmapped English backend message",
    });

    expect(getVietnameseApiErrorMessage(error, "Không thể cập nhật bàn.")).toBe(
      "Không thể cập nhật bàn."
    );
    expect(
      getVietnameseApiErrorMessage(new Error("English runtime message"), "Đã xảy ra lỗi.")
    ).toBe("Đã xảy ra lỗi.");
  });
});
