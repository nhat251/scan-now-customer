import dayjs from "dayjs";
import { ArrowDownAZ, ArrowUpAZ, ChevronsUpDown,Eye, MoreHorizontal, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Tag } from "@/components/ui/tag";
import { PATH } from "@/constants/path";
import type { BranchResponse } from "@/types/user-management";

import {
  BRANCH_PAGE_SIZE_OPTIONS,
  BRANCH_SORT_OPTIONS,
  getBranchSortOptionLabel,
  getBranchStatusLabel,
} from "./helpers";

type OwnerBranchesTableProps = {
  branches?: BranchResponse[];
  isLoading: boolean;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: number) => void;
  onSortChange: (sortBy: string, sortDirection: "asc" | "desc") => void;
  onOpenBranch: (href: string) => void;
  onToggleActive: (branch: BranchResponse) => void;
};

export const OwnerBranchesTable = ({
  branches,
  isLoading,
  pageNumber,
  pageSize,
  sortBy,
  sortDirection,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onOpenBranch,
  onToggleActive,
}: OwnerBranchesTableProps) => {
  const visibleRangeStart = totalItems === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const visibleRangeEnd = Math.min(pageNumber * pageSize, totalItems);

  return (
    <section className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border/60 flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Branches</h2>
          <p className="text-muted-foreground text-sm">
            Showing {visibleRangeStart}-{visibleRangeEnd} of {totalItems} branches
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ChevronsUpDown />
              {getBranchSortOptionLabel(sortBy, sortDirection)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {BRANCH_SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={`${option.sortBy}-${option.sortDirection}`}
                onClick={() => onSortChange(option.sortBy, option.sortDirection)}
              >
                {option.sortDirection === "asc" ? <ArrowDownAZ /> : <ArrowUpAZ />}
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto">
        <table className="divide-border/60 min-w-full divide-y text-left">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Branch</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Contact</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Address</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Hours</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Fees</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Status</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Created At</th>
              <th className="text-muted-foreground px-6 py-4 text-right text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-6 py-10 text-center text-sm">
                  Loading branches...
                </td>
              </tr>
            ) : !branches || branches.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-6 py-10 text-center text-sm">
                  No branches match the selected filters.
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.branchId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-foreground font-bold">{branch.name}</p>
                      <p className="text-muted-foreground text-xs font-medium">/{branch.slug}</p>
                      {branch.managerName ? <p className="text-muted-foreground mt-1 text-xs">Manager: {branch.managerName}</p> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <p>{branch.email || "-"}</p>
                      <p className="text-muted-foreground">{branch.phone || "-"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{branch.address || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    {branch.openTime || "-"} - {branch.closeTime || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <p>VAT: {branch.vatPercent}%</p>
                      <p>Service %: {branch.serviceChargePercent}%</p>
                      <p>Fixed: {branch.serviceChargeFixed}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Tag tagString={getBranchStatusLabel(branch)} variant={branch.isActive ? "success" : "warning"} />
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{dayjs(branch.createdAt).format("MMM D, YYYY")}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenBranch(PATH.owner.branchDetail(branch.branchId))}>
                          <Eye />
                          View branch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={branch.isActive ? "destructive" : "default"}
                          onClick={() => onToggleActive(branch)}
                        >
                          {branch.isActive ? <PowerOff /> : <Power />}
                          {branch.isActive ? "Deactivate branch" : "Activate branch"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FooterPagination
        page={pageNumber}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={BRANCH_PAGE_SIZE_OPTIONS}
        totalItems={totalItems}
        disabled={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
};
