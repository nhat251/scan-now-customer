import { Search } from "lucide-react";

import { FilterDropdown } from "@/components/organisms/manager-users/filter-dropdown";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/constants/roleLabels";
import type { BranchResponse, ManagedUserRole, UserStatusFilter } from "@/types/user-management";

import { getBranchFilterLabel, getRoleFilterLabel, getStatusFilterLabel, STATUS_FILTER_OPTIONS } from "./helpers";

const ROLE_OPTIONS: ManagedUserRole[] = ["BRANCH_MANAGER", "STAFF", "KITCHEN"];

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
  const roleFilterOptions = [
    { label: "All roles", value: "all" },
    ...ROLE_OPTIONS.map((role) => ({ label: getRoleLabel(role), value: role })),
  ];
  const branchFilterOptions = [
    { label: "All branches", value: "all" },
    ...branches.map((branch) => ({ label: branch.name, value: branch.branchId })),
  ];

  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <Field>
          <FieldLabel htmlFor="owner-users-search">Search</FieldLabel>
          <FieldContent>
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="owner-users-search"
                className="bg-muted/50 h-12 pl-9"
                placeholder="Search by name, username, email, phone, branch..."
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
              />
            </div>
          </FieldContent>
        </Field>

        <FilterDropdown
          id="owner-role-filter"
          label="Role"
          value={roleFilter}
          displayValue={getRoleFilterLabel(roleFilter)}
          options={roleFilterOptions}
          onValueChange={onRoleFilterChange}
        />

        <FilterDropdown
          id="owner-branch-filter"
          label="Branch"
          value={branchFilter}
          displayValue={getBranchFilterLabel(branchFilter, branches)}
          options={branchFilterOptions}
          onValueChange={onBranchFilterChange}
        />

        <FilterDropdown
          id="owner-status-filter"
          label="Status"
          value={statusFilter}
          displayValue={getStatusFilterLabel(statusFilter)}
          options={STATUS_FILTER_OPTIONS}
          onValueChange={onStatusFilterChange}
        />
      </div>
    </section>
  );
};
