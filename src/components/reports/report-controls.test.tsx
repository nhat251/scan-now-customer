import { describe, expect, it, vi } from "vitest";

import { OrderFilterSelect } from "@/components/owner/orders/order-filter-select";
import { ReportDateField } from "@/components/reports/report-date-field";
import { ReportPeriodButton } from "@/components/reports/report-period-button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("report and filter controls", () => {
  it("calls the period callback and exposes the active style", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ReportPeriodButton active onClick={onClick}>
        Tháng này
      </ReportPeriodButton>
    );

    const button = screen.getByRole("button", { name: "Tháng này" });
    expect(button).toHaveClass("bg-card");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps select values and date labels connected to native controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <>
        <OrderFilterSelect
          aria-label="Trạng thái đơn"
          defaultValue=""
          options={[
            { label: "Tất cả trạng thái", value: "" },
            { label: "Đã xác nhận", value: "Confirmed" },
          ]}
          onChange={onChange}
        />
        <ReportDateField label="Từ ngày" name="fromDate" defaultValue="2026-06-01" />
      </>
    );

    const select = screen.getByRole("combobox", { name: "Trạng thái đơn" });
    await user.selectOptions(select, "Confirmed");
    expect(select).toHaveValue("Confirmed");
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Từ ngày")).toHaveValue("2026-06-01");
  });
});
