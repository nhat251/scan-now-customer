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
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/helpers/presentation";
import type {
  BranchResponse,
  ManagerUserFormValues,
  ManagerUserRoleOption,
} from "@/types/user-management";

import { BranchMultiSelect } from "./branch-multi-select";
import { FilterDropdown } from "./filter-dropdown";

export type FormMode = "create" | "edit";

const ROLE_OPTIONS: ManagerUserRoleOption[] = ["STAFF", "KITCHEN", "CASHIER"];

type UserFormDialogProps = {
  branches: BranchResponse[];
  register: UseFormRegister<ManagerUserFormValues>;
  control: Control<ManagerUserFormValues>;
  errors: FieldErrors<ManagerUserFormValues>;
  setValue: UseFormSetValue<ManagerUserFormValues>;
  mode: FormMode;
  open: boolean;
  showBranchSelection?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
};

export const UserFormDialog = ({
  branches,
  register,
  control,
  errors,
  setValue,
  mode,
  open,
  showBranchSelection = true,
  onClose,
  onSubmit,
  pending,
}: UserFormDialogProps) => {
  const watchedValues = useWatch({ control });
  const branchIds = watchedValues.branchIds ?? [];
  const role = watchedValues.role ?? "STAFF";

  const selectedRoleLabel = role ? getRoleLabel(role) : "Chọn vai trò";

  const handleBranchToggle = (branchId: string) => {
    const nextBranchIds = branchIds.includes(branchId)
      ? branchIds.filter((id) => id !== branchId)
      : [...branchIds, branchId];
    setValue("branchIds", nextBranchIds, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo nhân sự" : "Cập nhật nhân sự"}</DialogTitle>
          <DialogDescription>
            Quản lý chi nhánh có thể quản lý nhân viên phục vụ, nhân viên bếp và thu ngân trong các
            chi nhánh được phân công.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup>
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
          </FieldGroup>

          <FieldGroup>
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

            <FilterDropdown
              id="role"
              label="Vai trò"
              value={role}
              displayValue={selectedRoleLabel}
              options={ROLE_OPTIONS.map((roleOption) => ({ label: roleOption, value: roleOption }))}
              onValueChange={(nextRole) => setValue("role", nextRole as ManagerUserRoleOption)}
            />

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
          </FieldGroup>
        </div>

        {showBranchSelection ? (
          <div className="space-y-2">
            <BranchMultiSelect
              branches={branches}
              selectedBranchIds={branchIds}
              onBranchToggle={handleBranchToggle}
            />
            <FieldError>{errors.branchIds?.message}</FieldError>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {mode === "create" ? "Tạo nhân sự" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
