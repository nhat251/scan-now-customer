import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
const mutateAsync = vi.fn();

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/hooks/mutations/useLoginMutation", () => ({
  getLoginRedirectPath: () => "/owner/dashboard",
  getLoginRedirectPathFromRole: () => "/owner/dashboard",
  mapLoginErrorMessage: () => "Không thể đăng nhập.",
  useLoginMutation: () => ({
    isPending: false,
    mutateAsync,
  }),
}));

vi.mock("@/stores/user", () => ({
  useUserStore: (
    selector: (state: { isAuthInitialized: boolean; user: null }) => unknown
  ) => selector({ isAuthInitialized: true, user: null }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({
      result: {
        accessToken: "token",
        user: { role: "OWNER" },
      },
    });
  });

  it("keeps React Hook Form fields, password visibility and submit payload connected", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Đăng nhập" });
    expect(submitButton).toBeDisabled();

    await user.type(
      screen.getByLabelText(/Tên đăng nhập hoặc email/),
      " owner@example.com "
    );
    await user.type(screen.getByLabelText(/Mật khẩu/), "secret");
    expect(submitButton).toBeEnabled();

    const passwordInput = screen.getByLabelText(/Mật khẩu/);
    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(submitButton);

    expect(mutateAsync).toHaveBeenCalledWith({
      identifier: "owner@example.com",
      password: "secret",
    });
    expect(replace).toHaveBeenCalledWith("/owner/dashboard");
  });

  it("shows only the Vietnamese mapped error", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(new Error("English backend error"));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/Tên đăng nhập hoặc email/), "owner");
    await user.type(screen.getByLabelText(/Mật khẩu/), "wrong");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findAllByText("Không thể đăng nhập.")).toHaveLength(2);
    expect(screen.queryByText("English backend error")).not.toBeInTheDocument();
  });
});
