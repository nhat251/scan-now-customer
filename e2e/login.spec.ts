import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const loginBackgroundPath = path.resolve(
  process.cwd(),
  "public/images/default-image.png"
);

test.beforeEach(async ({ page }) => {
  await page.route("**/_next/image?**", async (route) => {
    await route.fulfill({
      contentType: "image/png",
      path: loginBackgroundPath,
    });
  });

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { level: 2, name: "Đăng nhập" })
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
});

test("hiển thị giao diện đăng nhập hoàn toàn bằng tiếng Việt", async ({
  page,
}) => {
  await expect(page.getByText("Nhập thông tin tài khoản để tiếp tục.")).toBeVisible();
  await expect(page.getByLabel(/Tên đăng nhập hoặc email/)).toBeVisible();
  await expect(page.getByLabel(/Mật khẩu/)).toBeVisible();
  await expect(page.getByText("Ghi nhớ đăng nhập")).toBeVisible();
  await expect(page.getByText("Quên mật khẩu?")).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(
    /\b(welcome|sign in|username|password|remember me|forgot password)\b/i
  );
});

test("giữ đúng liên kết và trạng thái của biểu mẫu đăng nhập", async ({
  page,
}) => {
  const identifierInput = page.getByLabel(/Tên đăng nhập hoặc email/);
  const passwordInput = page.getByLabel(/Mật khẩu/);
  const submitButton = page.getByRole("button", { name: "Đăng nhập" });

  await expect(submitButton).toBeDisabled();
  await identifierInput.fill("owner@example.com");
  await passwordInput.fill("secret");
  await expect(submitButton).toBeEnabled();

  await expect(passwordInput).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Ẩn mật khẩu" })).toBeVisible();
});

test("không tràn ngang và không có lỗi accessibility nghiêm trọng", async ({
  page,
}) => {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalOverflow).toBe(false);

  const accessibilityResults = await new AxeBuilder({ page }).analyze();
  const seriousViolations = accessibilityResults.violations.filter(
    ({ impact }) => impact === "critical" || impact === "serious"
  );
  expect(seriousViolations).toEqual([]);
});

test("@visual giao diện đăng nhập không thay đổi", async ({ page }) => {
  await expect(page).toHaveScreenshot("login.png", {
    fullPage: true,
  });
});
