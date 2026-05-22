import { MoreHorizontal, ShieldBan, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Tag } from "@/components/ui/tag";
import { getRoleLabel } from "@/constants/roleLabels";
import { cn } from "@/lib/utils";
import type { ManagerScopedUserResponse } from "@/types/user-management";

import { formatDate, PAGE_SIZES } from "./helpers";

type ManagerUsersTableProps = {
  users: ManagerScopedUserResponse[];
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  managerHasNoBranch: boolean;
  pageNumber: number;
  pageSize: number;
  queryErrorMessage: string;
  totalPages: number;
  totalUsers: number;
  onEditUser: (user: ManagerScopedUserResponse) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onToggleBan: (user: ManagerScopedUserResponse) => void;
};

export const ManagerUsersTable = ({
  users,
  isError,
  isFetching,
  isLoading,
  managerHasNoBranch,
  pageNumber,
  pageSize,
  queryErrorMessage,
  totalPages,
  totalUsers,
  onEditUser,
  onPageChange,
  onPageSizeChange,
  onToggleBan,
}: ManagerUsersTableProps) => {
  const visibleRangeStart = totalUsers === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const visibleRangeEnd = Math.min(pageNumber * pageSize, totalUsers);

  return (
    <section className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border/60 flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-muted-foreground text-sm">
            Showing {visibleRangeStart}-{visibleRangeEnd} of {totalUsers} users
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-muted-foreground px-6 py-4 font-bold">Full Name</th>
              <th className="text-muted-foreground px-6 py-4 font-bold">Username</th>
              <th className="text-muted-foreground px-6 py-4 font-bold">Email / Phone</th>
              <th className="text-muted-foreground px-6 py-4 font-bold">Role</th>
              <th className="text-muted-foreground px-6 py-4 font-bold">Branches</th>
              <th className="text-muted-foreground px-6 py-4 font-bold">Status</th>
              <th className="text-muted-foreground px-6 py-4 font-bold">Created</th>
              <th className="text-muted-foreground px-6 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="text-muted-foreground px-6 py-10 text-center text-sm" colSpan={8}>
                  Loading users...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="text-destructive px-6 py-10 text-center text-sm" colSpan={8}>
                  {managerHasNoBranch
                    ? "Your manager account is not assigned to any branch yet. Please contact an owner to assign a branch before managing staff."
                    : `Failed to load users. ${queryErrorMessage}`}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-6 py-10 text-center text-sm" colSpan={8}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userId} className="border-border/40 hover:bg-muted/30 border-t align-top transition-colors">
                  <td className="px-6 py-4 font-semibold">{user.fullName}</td>
                  <td className="px-6 py-4">{user.username}</td>
                  <td className="px-6 py-4">
                    <div>{user.email}</div>
                    <div className="text-muted-foreground">{user.phoneNumber || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary/10 text-secondary inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                      <Tag tagString={user.isBanned ? "Banned" : user.isActive ? "Active" : "Inactive"} />
                    </div>
                  </td>
                  <td className="px-6 py-4">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${user.fullName}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditUser(user)}>Update user</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleBan(user)} className={cn(user.isBanned ? "" : "text-destructive")}>
                          {user.isBanned ? <Users className="size-4" /> : <ShieldBan className="size-4" />}
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
        totalPages={Math.max(totalPages, 1)}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZES}
        totalItems={totalUsers}
        disabled={isFetching || isError}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
};
