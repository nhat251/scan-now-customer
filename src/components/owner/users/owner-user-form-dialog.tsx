import { useMemo } from "react";
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/constants/roleLabels";
import { cn } from "@/lib/utils";
import type { BranchResponse, ManagedUserRole, UserFormValues } from "@/types/user-management";

const ROLE_OPTIONS: ManagedUserRole[] = ["BRANCH_MANAGER", "STAFF", "KITCHEN", "CASHIER"];

type OwnerUserFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  register: UseFormRegister<UserFormValues>;
  control: Control<UserFormValues>;
  errors: FieldErrors<UserFormValues>;
  branches: BranchResponse[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  setValue: UseFormSetValue<UserFormValues>;
  onSubmit: () => void;
};

export const OwnerUserFormDialog = ({
  open,
  mode,
  register,
  control,
  errors,
  branches,
  submitting,
  onOpenChange,
  setValue,
  onSubmit,
}: OwnerUserFormDialogProps) => {
  const watchedValues = useWatch({ control });
  const branchIds = watchedValues.branchIds;
  const role = watchedValues.role ?? "STAFF";

  const selectedBranchSet = useMemo(() => new Set(branchIds || []), [branchIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo nhân sự" : "Cập nhật nhân sự"}</DialogTitle>
          <DialogDescription>
            Chủ nhà hàng có thể quản lý quản lý chi nhánh, nhân viên phục vụ, nhân viên bếp và thu
            ngân trong nhà hàng.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fullName" required>
                Họ và tên
              </FieldLabel>
              <FieldContent>
                <Input
                  id="fullName"
                  placeholder="Nhập họ và tên"
                  aria-invalid={!!errors.fullName}
                  {...register("fullName")}
                />
                <FieldError>{errors.fullName?.message}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="username" required>
                Tên đăng nhập
              </FieldLabel>
              <FieldContent>
                <Input
                  id="username"
                  placeholder="Nhập tên đăng nhập"
                  aria-invalid={!!errors.username}
                  {...register("username")}
                />
                <FieldError>{errors.username?.message}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email" required>
                Email
              </FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="phoneNumber">Số điện thoại</FieldLabel>
              <FieldContent>
                <Input
                  id="phoneNumber"
                  placeholder="Số điện thoại (không bắt buộc)"
                  aria-invalid={!!errors.phoneNumber}
                  {...register("phoneNumber")}
                />
                <FieldError>{errors.phoneNumber?.message}</FieldError>
              </FieldContent>
            </Field>

            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="password" required>
                  Mật khẩu
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FieldError>{errors.password?.message}</FieldError>
                </FieldContent>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="role" required>
                Vai trò
              </FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="role"
                      variant="outline"
                      className="w-full justify-between"
                      aria-invalid={!!errors.role}
                    >
                      {getRoleLabel(role)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                    <DropdownMenuRadioGroup
                      value={role}
                      onValueChange={(nextRole) => setValue("role", nextRole as ManagedUserRole)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <DropdownMenuRadioItem key={r} value={r}>
                          {getRoleLabel(r)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldError>{errors.role?.message}</FieldError>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel required>Phân công chi nhánh</FieldLabel>
            <FieldContent>
              <div className="border-border/70 grid gap-3 rounded-2xl border p-4 md:grid-cols-2">
                {branches.map((branch) => {
                  const checked = selectedBranchSet.has(branch.branchId);

                  return (
                    <DropdownMenu key={branch.branchId}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto justify-start rounded-2xl px-3 py-3 text-left",
                            checked
                              ? "border-primary-container bg-primary-container/5"
                              : "border-border/70 hover:bg-muted/50"
                          )}
                        >
                          <div>
                            <p className="font-medium">{branch.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {branch.address || branch.email || branch.slug}
                            </p>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuCheckboxItem
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            const shouldCheck = nextChecked === true;
                            const currentBranchIds = branchIds || [];
                            const nextBranchIds = shouldCheck
                              ? [...currentBranchIds, branch.branchId]
                              : currentBranchIds.filter((id) => id !== branch.branchId);

                            setValue("branchIds", nextBranchIds, { shouldValidate: true });
                          }}
                        >
                          Phân công {branch.name}
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}
              </div>
              <FieldError>{errors.branchIds?.message}</FieldError>
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {mode === "create" ? "Tạo nhân sự" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
