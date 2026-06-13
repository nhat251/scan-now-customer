import { Search } from "lucide-react";

import { FilterDropdown } from "@/components/organisms/manager-users/filter-dropdown";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { BRANCH_STATUS_FILTER_OPTIONS, type BranchStatusFilter, getBranchStatusFilterLabel } from "./helpers";

type OwnerBranchesToolbarProps = {
  searchInput: string;
  statusFilter: BranchStatusFilter;
  onSearchInputChange: (value: string) => void;
  onStatusFilterChange: (value: BranchStatusFilter) => void;
};

export const OwnerBranchesToolbar = ({
  searchInput,
  statusFilter,
  onSearchInputChange,
  onStatusFilterChange,
}: OwnerBranchesToolbarProps) => {
  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Field>
          <FieldLabel htmlFor="owner-branches-search">Tìm kiếm</FieldLabel>
          <FieldContent>
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="owner-branches-search"
                className="bg-muted/50 h-12 pl-9"
                placeholder="Tìm theo tên chi nhánh, email, số điện thoại, địa chỉ..."
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
              />
            </div>
          </FieldContent>
        </Field>

        <FilterDropdown
          id="owner-branches-status-filter"
          label="Trạng thái"
          value={statusFilter}
          displayValue={getBranchStatusFilterLabel(statusFilter)}
          options={BRANCH_STATUS_FILTER_OPTIONS}
          onValueChange={onStatusFilterChange}
        />
      </div>
    </section>
  );
};
