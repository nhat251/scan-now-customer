import { describe, expect, it } from "vitest";

import {
  getDiscountTypeLabel,
  getOrderItemStatusLabel,
  getOrderSourceLabel,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getRoleLabel,
  getTableStatusLabel,
  getUserStatusLabel,
} from "@/helpers/presentation";

describe("presentation labels", () => {
  it.each([
    ["ADMIN", "Quản trị viên hệ thống"],
    ["OWNER", "Chủ nhà hàng"],
    ["MANAGER", "Quản lý"],
    ["BRANCH_MANAGER", "Quản lý chi nhánh"],
    ["STAFF", "Nhân viên phục vụ"],
    ["KITCHEN", "Nhân viên bếp"],
    ["CASHIER", "Thu ngân"],
  ])("maps role %s", (value, expected) => {
    expect(getRoleLabel(value)).toBe(expected);
  });

  it.each([
    ["PendingConfirmation", "Chờ xác nhận"],
    ["Confirmed", "Đã xác nhận"],
    ["Preparing", "Đang chuẩn bị"],
    ["PartiallyReady", "Một phần món đã sẵn sàng"],
    ["ReadyToServe", "Sẵn sàng phục vụ"],
    ["PartiallyServed", "Đã phục vụ một phần"],
    ["Served", "Đã phục vụ"],
    ["Completed", "Hoàn thành"],
    ["Cancelled", "Đã hủy"],
  ])("maps order status %s", (value, expected) => {
    expect(getOrderStatusLabel(value)).toBe(expected);
  });

  it.each([
    ["Pending", "Chờ xác nhận"],
    ["Confirmed", "Đã xác nhận"],
    ["Cooking", "Đang chế biến"],
    ["Ready", "Sẵn sàng phục vụ"],
    ["Served", "Đã phục vụ"],
    ["Cancelled", "Đã hủy"],
  ])("maps order item status %s", (value, expected) => {
    expect(getOrderItemStatusLabel(value)).toBe(expected);
  });

  it.each([
    ["CASH", "Tiền mặt"],
    ["PAYOS", "PayOS"],
    ["BANK_TRANSFER", "Chuyển khoản ngân hàng"],
  ])("maps payment method %s", (value, expected) => {
    expect(getPaymentMethodLabel(value)).toBe(expected);
  });

  it.each([
    ["NO_PAYMENT", "Chưa thanh toán"],
    ["PENDING", "Đang chờ thanh toán"],
    ["SUCCESS", "Thanh toán thành công"],
    ["FAILED", "Thanh toán thất bại"],
    ["REFUNDED", "Đã hoàn tiền"],
  ])("maps payment status %s", (value, expected) => {
    expect(getPaymentStatusLabel(value)).toBe(expected);
  });

  it.each([
    ["AVAILABLE", "Còn trống"],
    ["OCCUPIED", "Đang có khách"],
    ["RESERVED", "Đã đặt trước"],
    ["DISABLED", "Ngừng sử dụng"],
    [0, "Còn trống"],
    [1, "Đang có khách"],
    [2, "Đã đặt trước"],
    [3, "Ngừng sử dụng"],
  ])("maps table status %s", (value, expected) => {
    expect(getTableStatusLabel(value)).toBe(expected);
  });

  it("maps discount, order source and user status", () => {
    expect(getDiscountTypeLabel("PERCENT")).toBe("Giảm theo phần trăm");
    expect(getDiscountTypeLabel("FIXED_AMOUNT")).toBe("Giảm số tiền cố định");
    expect(getOrderSourceLabel("CUSTOMER")).toBe("Khách hàng tự đặt");
    expect(getOrderSourceLabel("STAFF")).toBe("Nhân viên phục vụ tạo");
    expect(getUserStatusLabel("active")).toBe("Đang hoạt động");
    expect(getUserStatusLabel("banned")).toBe("Đã khóa");
  });

  it("never exposes unknown backend values", () => {
    expect(getRoleLabel("SUPER_USER")).toBe("Vai trò không xác định");
    expect(getOrderStatusLabel("ARCHIVED")).toBe("Trạng thái đơn không xác định");
    expect(getOrderItemStatusLabel("PLATED")).toBe("Trạng thái món không xác định");
    expect(getPaymentMethodLabel("CRYPTO")).toBe("Phương thức thanh toán không xác định");
    expect(getPaymentStatusLabel("REVERSED")).toBe("Trạng thái thanh toán không xác định");
    expect(getTableStatusLabel(99)).toBe("Trạng thái bàn không xác định");
    expect(getDiscountTypeLabel("TIERED")).toBe("Loại giảm giá không xác định");
    expect(getOrderSourceLabel("BOT")).toBe("Nguồn đơn không xác định");
    expect(getUserStatusLabel("SUSPENDED")).toBe("Trạng thái tài khoản không xác định");
  });

  it("uses Vietnamese fallbacks for empty values", () => {
    expect(getRoleLabel(null)).toBe("Vai trò không xác định");
    expect(getOrderStatusLabel(undefined)).toBe("Trạng thái đơn không xác định");
    expect(getPaymentStatusLabel(null)).toBe("Chưa thanh toán");
  });
});
