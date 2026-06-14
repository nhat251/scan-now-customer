import { useEffect } from "react";
import { Search } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { UserStatusFilter } from "@/types/user-management";

import { FilterDropdown } from "./filter-dropdown";
import { STATUS_OPTIONS } from "./helpers";

type ManagerUsersToolbarProps = {
  branchFilterLabel: string;
  branchFilterOptions: Array<{ label: string; value: string }>;
  branchValue: string;
  roleFilterLabel: string;
  roleFilterOptions: Array<{ label: string; value: string }>;
  roleValue: string;
  searchInput: string;
  status: UserStatusFilter;
  statusFilterLabel: string;
  onBranchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: UserStatusFilter) => void;
};

type ToolbarFormValues = {
  search: string;
  role: string;
  branch: string;
  status: UserStatusFilter;
};

export const ManagerUsersToolbar = ({
  branchFilterLabel,
  branchFilterOptions,
  branchValue,
  roleFilterLabel,
  roleFilterOptions,
  roleValue,
  searchInput,
  status,
  statusFilterLabel,
  onBranchChange,
  onRoleChange,
  onSearchChange,
  onStatusChange,
}: ManagerUsersToolbarProps) => {
  const { register, control, setValue } = useForm<ToolbarFormValues>({
    defaultValues: {
      search: searchInput,
      role: roleValue,
      branch: branchValue,
      status: status,
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const roleVal = useWatch({ control, name: "role" });
  const branchVal = useWatch({ control, name: "branch" });
  const statusVal = useWatch({ control, name: "status" });

  useEffect(() => {
    onSearchChange(searchVal);
  }, [searchVal, onSearchChange]);

  useEffect(() => {
    onRoleChange(roleVal);
  }, [roleVal, onRoleChange]);

  useEffect(() => {
    onBranchChange(branchVal);
  }, [branchVal, onBranchChange]);

  useEffect(() => {
    onStatusChange(statusVal);
  }, [statusVal, onStatusChange]);

  useEffect(() => {
    setValue("search", searchInput);
  }, [searchInput, setValue]);

  useEffect(() => {
    setValue("role", roleValue);
  }, [roleValue, setValue]);

  useEffect(() => {
    setValue("branch", branchValue);
  }, [branchValue, setValue]);

  useEffect(() => {
    setValue("status", status);
  }, [status, setValue]);

  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <Field>
          <FieldLabel htmlFor="search">Tìm kiếm</FieldLabel>
          <FieldContent>
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="search"
                className="bg-muted/50 h-12 pl-9"
                placeholder="Tìm theo tên, tên đăng nhập, email, số điện thoại hoặc chi nhánh..."
                {...register("search")}
              />
            </div>
          </FieldContent>
        </Field>

        <FilterDropdown
          id="role-filter"
          label="Vai trò"
          value={roleVal}
          displayValue={roleFilterLabel}
          options={roleFilterOptions}
          onValueChange={(val) => setValue("role", val)}
        />

        <FilterDropdown
          id="branch-filter"
          label="Chi nhánh"
          value={branchVal}
          displayValue={branchFilterLabel}
          options={branchFilterOptions}
          onValueChange={(val) => setValue("branch", val)}
        />

        <FilterDropdown
          id="status-filter"
          label="Trạng thái"
          value={statusVal}
          displayValue={statusFilterLabel}
          options={STATUS_OPTIONS}
          onValueChange={(val) => setValue("status", val)}
        />
      </div>
    </section>
  );
};
