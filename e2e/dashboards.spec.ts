import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { mockDashboardSession } from "./dashboard-fixtures";

const scenarios = [
  {
    name: "báo cáo chủ nhà hàng",
    path: "/owner/dashboard",
    role: "OWNER" as const,
    readyText: "Biểu đồ doanh thu",
    screenshot: "owner-dashboard.png",
  },
  {
    name: "vận hành nhân viên phục vụ",
    path: "/staff/dashboard",
    role: "STAFF" as const,
    readyText: "Đơn hàng",
    screenshot: "waiter-dashboard.png",
  },
  {
    name: "vận hành thu ngân",
    path: "/cashier/dashboard",
    role: "CASHIER" as const,
    readyText: "Quản lý đơn hàng",
    screenshot: "cashier-dashboard.png",
  },
];

for (const scenario of scenarios) {
  test(`${scenario.name} không tràn ngang và không có lỗi accessibility nghiêm trọng`, async ({
    page,
  }) => {
    await mockDashboardSession(page, scenario.role);
    await page.goto(scenario.path);
    await expect(page.getByText(scenario.readyText).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    const accessibilityResults = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();
    const seriousViolations = accessibilityResults.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious"
    );
    expect(seriousViolations).toEqual([]);
  });

  test(`@visual ${scenario.name} giữ nguyên bố cục`, async ({ page }) => {
    await mockDashboardSession(page, scenario.role);
    await page.goto(scenario.path);
    await expect(page.getByText(scenario.readyText).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: "[data-sonner-toaster] { display: none !important; }",
    });

    await expect(page).toHaveScreenshot(scenario.screenshot, {
      fullPage: true,
    });
  });
}
