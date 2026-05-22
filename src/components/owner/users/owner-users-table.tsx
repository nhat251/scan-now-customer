import dayjs from "dayjs";
import { ArrowDownAZ, ArrowUpAZ, Ban, CheckCircle2, ChevronsUpDown, Mail, MoreHorizontal, Phone, UserCog } from "lucide-react";

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
import { getRoleLabel } from "@/constants/roleLabels";
import type { OwnerScopedUserResponse } from "@/types/user-management";

import { getInitials, getSortOptionLabel, getStatusBadge, PAGE_SIZE_OPTIONS, SORT_OPTIONS } from "./helpers";

type OwnerUsersTableProps = {
  users?: OwnerScopedUserResponse[];
  isLoading: boolean;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: "asc" | "desc";
  totalItems: number;
  totalPages: number;
  onOpenEditDialog: (user: OwnerScopedUserResponse) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (value: number) => void;
  onSortChange: (sortBy: string, sortDirection: "asc" | "desc") => void;
  onToggleBan: (user: OwnerScopedUserResponse) => void;
};

export const OwnerUsersTable = ({
  users,
  isLoading,
  pageNumber,
  pageSize,
  sortBy,
  sortDirection,
  totalItems,
  totalPages,
  onOpenEditDialog,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onToggleBan,
}: OwnerUsersTableProps) => {
  const visibleRangeStart = totalItems === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const visibleRangeEnd = Math.min(pageNumber * pageSize, totalItems);

  return (
    <section className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border/60 flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-muted-foreground text-sm">
            Showing {visibleRangeStart}-{visibleRangeEnd} of {totalItems} users
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ChevronsUpDown />
              {getSortOptionLabel(sortBy, sortDirection)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
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
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Full Name</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Contact</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Role</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Branch</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Status</th>
              <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Created At</th>
              <th className="text-muted-foreground px-6 py-4 text-right text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-6 py-10 text-center text-sm">
                  Loading users...
                </td>
              </tr>
            ) : !users || users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-6 py-10 text-center text-sm">
                  No users match the selected filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-bold">
                        {getInitials(user.fullName)}
                      </div>
                      <div>
                        <p className="text-foreground font-bold">{user.fullName}</p>
                        <p className="text-muted-foreground text-xs font-medium">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{user.phoneNumber || "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary/10 text-secondary inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <p className="mb-2 font-medium">{user.restaurantName}</p>
                    <div className="flex flex-wrap gap-2">
                      {user.branchNames.length > 0 ? (
                        user.branchNames.map((branchName) => <Tag key={`${user.userId}-${branchName}`} tagString={branchName} />)
                      ) : (
                        <Tag tagString="No branches" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Tag tagString={getStatusBadge(user)} />
                    </div>
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{dayjs(user.createdAt).format("MMM D, YYYY")}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOpenEditDialog(user)}>
                          <UserCog />
                          Update user
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={user.isBanned ? "default" : "destructive"}
                          onClick={() => onToggleBan(user)}
                        >
                          {user.isBanned ? <CheckCircle2 /> : <Ban />}
                          {user.isBanned ? "Unban user" : "Ban user"}
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
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalItems={totalItems}
        disabled={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
};
