import { Search } from "lucide-react";

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
  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <Field>
          <FieldLabel htmlFor="search">Search</FieldLabel>
          <FieldContent>
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="search"
                className="bg-muted/50 h-12 pl-9"
                placeholder="Search by name, username, email, phone, branch..."
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
          </FieldContent>
        </Field>

        <FilterDropdown
          id="role-filter"
          label="Role"
          value={roleValue}
          displayValue={roleFilterLabel}
          options={roleFilterOptions}
          onValueChange={onRoleChange}
        />

        <FilterDropdown
          id="branch-filter"
          label="Branch"
          value={branchValue}
          displayValue={branchFilterLabel}
          options={branchFilterOptions}
          onValueChange={onBranchChange}
        />

        <FilterDropdown
          id="status-filter"
          label="Status"
          value={status}
          displayValue={statusFilterLabel}
          options={STATUS_OPTIONS}
          onValueChange={onStatusChange}
        />
      </div>
    </section>
  );
};
