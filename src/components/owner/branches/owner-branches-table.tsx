import dayjs from "dayjs";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronsUpDown,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
  Soup,
  Tags,
} from "lucide-react";

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
          <h2 className="text-lg font-semibold">Danh sách chi nhánh</h2>
          <p className="text-muted-foreground text-sm">
            Đang hiển thị {visibleRangeStart}-{visibleRangeEnd} trên tổng số {totalItems} chi nhánh
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
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Chi nhánh</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Liên hệ</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Địa chỉ</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Giờ mở cửa</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Phí</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Trạng thái</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Ngày tạo</th>
              <th className="text-muted-foreground px-6 py-4 text-right text-sm font-bold">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-6 py-10 text-center text-sm">
                  Đang tải chi nhánh...
                </td>
              </tr>
            ) : !branches || branches.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-6 py-10 text-center text-sm">
                  Không có chi nhánh phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr
                  key={branch.branchId}
                  tabIndex={0}
                  role="button"
                  onClick={() => onOpenBranch(PATH.owner.branchDetail(branch.branchId))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenBranch(PATH.owner.branchDetail(branch.branchId));
                    }
                  }}
                  className="hover:bg-muted/40 focus-visible:ring-primary/40 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-foreground font-bold">{branch.name}</p>
                      <p className="text-muted-foreground text-xs font-medium">/{branch.slug}</p>
                      {branch.managerName ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Quản lý: {branch.managerName}
                        </p>
                      ) : null}
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
                      <p>Phí DV: {branch.serviceChargePercent}%</p>
                      <p>Phí cố định: {branch.serviceChargeFixed}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Tag
                      tagString={getBranchStatusLabel(branch)}
                      variant={branch.isActive ? "success" : "warning"}
                    />
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {dayjs(branch.createdAt).format("DD/MM/YYYY")}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onOpenBranch(PATH.owner.branchDetail(branch.branchId))}
                        >
                          <Eye />
                          Xem chi nhánh
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onOpenBranch(PATH.owner.branchCategories(branch.branchId))}
                        >
                          <Tags />
                          Danh mục
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onOpenBranch(PATH.owner.branchMenuItems(branch.branchId))}
                        >
                          <Soup />
                          Món ăn
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={branch.isActive ? "destructive" : "default"}
                          onClick={() => onToggleActive(branch)}
                        >
                          {branch.isActive ? <PowerOff /> : <Power />}
                          {branch.isActive ? "Tắt chi nhánh" : "Kích hoạt chi nhánh"}
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
