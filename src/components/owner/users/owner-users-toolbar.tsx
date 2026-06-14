import { useEffect } from "react";
import { Search } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { FilterDropdown } from "@/components/organisms/manager-users/filter-dropdown";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/constants/roleLabels";
import type { BranchResponse, ManagedUserRole, UserStatusFilter } from "@/types/user-management";

import {
  getBranchFilterLabel,
  getRoleFilterLabel,
  getStatusFilterLabel,
  STATUS_FILTER_OPTIONS,
} from "./helpers";

const ROLE_OPTIONS: ManagedUserRole[] = ["BRANCH_MANAGER", "STAFF", "KITCHEN", "CASHIER"];

type OwnerUsersToolbarProps = {
  branches: BranchResponse[];
  branchFilter: string;
  roleFilter: string;
  searchInput: string;
  statusFilter: UserStatusFilter;
  onBranchFilterChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onSearchInputChange: (value: string) => void;
  onStatusFilterChange: (value: UserStatusFilter) => void;
};

type ToolbarFormValues = {
  search: string;
  role: string;
  branch: string;
  status: UserStatusFilter;
};

export const OwnerUsersToolbar = ({
  branches,
  branchFilter,
  roleFilter,
  searchInput,
  statusFilter,
  onBranchFilterChange,
  onRoleFilterChange,
  onSearchInputChange,
  onStatusFilterChange,
}: OwnerUsersToolbarProps) => {
  const { register, control, setValue } = useForm<ToolbarFormValues>({
    defaultValues: {
      search: searchInput,
      role: roleFilter,
      branch: branchFilter,
      status: statusFilter,
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const roleVal = useWatch({ control, name: "role" });
  const branchVal = useWatch({ control, name: "branch" });
  const statusVal = useWatch({ control, name: "status" });

  useEffect(() => {
    onSearchInputChange(searchVal);
  }, [searchVal, onSearchInputChange]);

  useEffect(() => {
    onRoleFilterChange(roleVal);
  }, [roleVal, onRoleFilterChange]);

  useEffect(() => {
    onBranchFilterChange(branchVal);
  }, [branchVal, onBranchFilterChange]);

  useEffect(() => {
    onStatusFilterChange(statusVal);
  }, [statusVal, onStatusFilterChange]);

  useEffect(() => {
    setValue("search", searchInput);
  }, [searchInput, setValue]);

  useEffect(() => {
    setValue("role", roleFilter);
  }, [roleFilter, setValue]);

  useEffect(() => {
    setValue("branch", branchFilter);
  }, [branchFilter, setValue]);

  useEffect(() => {
    setValue("status", statusFilter);
  }, [statusFilter, setValue]);

  const roleFilterOptions = [
    { label: "Tất cả vai trò", value: "all" },
    ...ROLE_OPTIONS.map((role) => ({ label: getRoleLabel(role), value: role })),
  ];
  const branchFilterOptions = [
    { label: "Tất cả chi nhánh", value: "all" },
    ...branches.map((branch) => ({ label: branch.name, value: branch.branchId })),
  ];

  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <Field>
          <FieldLabel htmlFor="owner-users-search">Tìm kiếm</FieldLabel>
          <FieldContent>
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="owner-users-search"
                className="bg-muted/50 h-12 pl-9"
                placeholder="Tìm theo tên, tên đăng nhập, email, số điện thoại hoặc chi nhánh..."
                {...register("search")}
              />
            </div>
          </FieldContent>
        </Field>

        <FilterDropdown
          id="owner-role-filter"
          label="Vai trò"
          value={roleVal}
          displayValue={getRoleFilterLabel(roleVal)}
          options={roleFilterOptions}
          onValueChange={(val) => setValue("role", val)}
        />

        <FilterDropdown
          id="owner-branch-filter"
          label="Chi nhánh"
          value={branchVal}
          displayValue={getBranchFilterLabel(branchVal, branches)}
          options={branchFilterOptions}
          onValueChange={(val) => setValue("branch", val)}
        />

        <FilterDropdown
          id="owner-status-filter"
          label="Trạng thái"
          value={statusVal}
          displayValue={getStatusFilterLabel(statusVal)}
          options={STATUS_FILTER_OPTIONS}
          onValueChange={(val) => setValue("status", val)}
        />
      </div>
    </section>
  );
};
