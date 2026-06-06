"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { getOwnerPortalErrorState, statusFilterToQuery } from "@/components/owner/users/helpers";
import { getOwnerPortalNavItems } from "@/components/owner/users/owner-portal-nav";
import { OwnerUserFormDialog } from "@/components/owner/users/owner-user-form-dialog";
import { OwnerUsersTable } from "@/components/owner/users/owner-users-table";
import { OwnerUsersToolbar } from "@/components/owner/users/owner-users-toolbar";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import {
  useBanOwnerUserMutation,
  useCreateOwnerUserMutation,
  useUnbanOwnerUserMutation,
  useUpdateOwnerUserMutation,
} from "@/hooks/mutations/useOwnerUserMutations";
import { useOwnerBranchesQuery } from "@/hooks/queries/useOwnerBranchesQuery";
import { useOwnerUsersQuery } from "@/hooks/queries/useOwnerUsersQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { OwnerScopedUserResponse, UserFormValues, UserListQuery, UserStatusFilter } from "@/types/user-management";

const EMPTY_FORM: UserFormValues = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "STAFF",
  branchIds: [],
};

export const OwnerUsersPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim());
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OwnerScopedUserResponse | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});

  useEffect(() => {
    setPageNumber(1);
  }, [search]);

  const filters = useMemo<UserListQuery>(() => {
    return {
      pageNumber,
      pageSize,
      search: search || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      branchId: branchFilter === "all" ? undefined : branchFilter,
      sortBy,
      sortDirection,
      ...statusFilterToQuery(statusFilter),
    };
  }, [branchFilter, pageNumber, pageSize, roleFilter, search, sortBy, sortDirection, statusFilter]);

  const usersQuery = useOwnerUsersQuery(filters);
  const branchesQuery = useOwnerBranchesQuery();
  const createMutation = useCreateOwnerUserMutation();
  const updateMutation = useUpdateOwnerUserMutation();
  const banMutation = useBanOwnerUserMutation();
  const unbanMutation = useUnbanOwnerUserMutation();

  const users = usersQuery.data?.items;
  const branches = branchesQuery.data ?? [];
  const totalItems = usersQuery.data?.totalItems ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 1;
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || banMutation.isPending || unbanMutation.isPending;

  const branchManagerCount = (users ?? []).filter((user) => user.role === "BRANCH_MANAGER").length;
  const activeUserCount = (users ?? []).filter((user) => user.isActive && !user.isBanned).length;
  const restaurantName = users?.[0]?.restaurantName ?? "Cổng chủ quán";

  const resetForm = () => {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingUser(null);
  };

  const clampPageAfterMutation = (nextTotalPages?: number) => {
    if (!nextTotalPages) {
      return;
    }

    setPageNumber((currentPage) => Math.min(currentPage, Math.max(nextTotalPages, 1)));
  };

  const refreshUsers = async () => {
    const result = await usersQuery.refetch();
    clampPageAfterMutation(result.data?.totalPages);
    return result;
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const finishMutation = async () => {
    await refreshUsers();
    closeDialog();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: OwnerScopedUserResponse) => {
    setDialogMode("edit");
    setEditingUser(user);
    setFormErrors({});
    setFormValues({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
      password: "",
      role: user.role,
      branchIds: user.branchIds,
    });
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof UserFormValues, string>> = {};

    if (!formValues.fullName.trim()) {
      nextErrors.fullName = "Họ tên là bắt buộc.";
    }

    if (!formValues.username.trim()) {
      nextErrors.username = "Tên đăng nhập là bắt buộc.";
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Email là bắt buộc.";
    }

    if (dialogMode === "create" && !formValues.password.trim()) {
      nextErrors.password = "Mật khẩu là bắt buộc.";
    }

    if (!formValues.branchIds.length) {
      nextErrors.branchIds = "Chọn ít nhất một chi nhánh.";
    }

    setFormErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async () => {
    if (!validateForm()) {
      return;
    }

    if (dialogMode === "create") {
      await createMutation.mutateAsync({
        fullName: formValues.fullName.trim(),
        username: formValues.username.trim(),
        email: formValues.email.trim(),
        phoneNumber: formValues.phoneNumber.trim() || undefined,
        password: formValues.password,
        role: formValues.role,
        branchIds: formValues.branchIds,
      });

      await finishMutation();
      return;
    }

    if (!editingUser) {
      showNotify({
        type: "error",
        message: "Không thể cập nhật nhân sự vì thiếu dữ liệu đã chọn. Vui lòng mở lại hộp thoại và thử lại.",
        duration: 4000,
      });
      closeDialog();
      return;
    }

    await updateMutation.mutateAsync({
      id: editingUser.userId,
      data: {
        fullName: formValues.fullName.trim(),
        username: formValues.username.trim(),
        email: formValues.email.trim(),
        phoneNumber: formValues.phoneNumber.trim() || undefined,
        role: formValues.role,
        branchIds: formValues.branchIds,
      },
    });

    await finishMutation();
  };

  const handleBanToggle = async (user: OwnerScopedUserResponse) => {
    if (user.isBanned) {
      await unbanMutation.mutateAsync({ id: user.userId });
      await refreshUsers();
      return;
    }

    await banMutation.mutateAsync({ id: user.userId });
    await refreshUsers();
  };

  const onChangeField = <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => {
    setFormValues((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  };

  const hasQueryFailure = usersQuery.isError || branchesQuery.isError;
  const errorState = hasQueryFailure ? getOwnerPortalErrorState(usersQuery.error, branchesQuery.error) : null;

  if (errorState) {
    return (
      <PortalShell
        title="Nhân sự"
        description="Quản lý quyền truy cập của nhân viên trên toàn bộ chi nhánh."
        portalLabel="Bộ quản lý"
        portalName="Cổng chủ quán"
        navItems={getOwnerPortalNavItems("users")}
        topbarTitle={restaurantName}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Cổng chủ quán</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{errorState.heading}</h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">{errorState.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                await Promise.all([usersQuery.refetch(), branchesQuery.refetch()]);
              }}
              disabled={usersQuery.isRefetching || branchesQuery.isRefetching}
            >
              {errorState.retryLabel}
            </Button>
            {errorState.shouldRouteToLogin ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                {errorState.primaryActionLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title="Nhân sự"
      description="Quản lý quyền truy cập của nhân viên trên toàn bộ chi nhánh."
      portalLabel="Bộ quản lý"
      portalName="Cổng chủ quán"
      navItems={getOwnerPortalNavItems("users")}
      topbarTitle={restaurantName}
      currentUser={currentUser}
      headerAction={
        <Button size="lg" className="h-12 px-8" onClick={openCreateDialog}>
          <Plus />
          Tạo nhân sự
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Tổng nhân sự" value={String(totalItems)} helper="Số tài khoản trong hệ thống" />
          <PortalStatCard label="Quản lý chi nhánh" value={String(branchManagerCount)} helper="Quản lý trong phạm vi hiện tại" />
          <PortalStatCard label="Chi nhánh quản lý" value={String(branches.length)} helper="Chi nhánh trả về từ hệ thống" />
          <PortalStatCard label="Đang hoạt động" value={String(activeUserCount)} helper="Tài khoản hoạt động và không bị khóa" />
        </>
      }
    >
      <OwnerUsersToolbar
        branches={branches}
        branchFilter={branchFilter}
        roleFilter={roleFilter}
        searchInput={searchInput}
        statusFilter={statusFilter}
        onBranchFilterChange={(value) => {
          setBranchFilter(value);
          setPageNumber(1);
        }}
        onRoleFilterChange={(value) => {
          setRoleFilter(value);
          setPageNumber(1);
        }}
        onSearchInputChange={setSearchInput}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPageNumber(1);
        }}
      />

      <OwnerUsersTable
        users={users}
        isLoading={usersQuery.isLoading}
        pageNumber={pageNumber}
        pageSize={pageSize}
        sortBy={sortBy}
        sortDirection={sortDirection}
        totalItems={totalItems}
        totalPages={totalPages}
        onOpenEditDialog={openEditDialog}
        onPageChange={setPageNumber}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPageNumber(1);
        }}
        onSortChange={(nextSortBy, nextSortDirection) => {
          setSortBy(nextSortBy);
          setSortDirection(nextSortDirection);
          setPageNumber(1);
        }}
        onToggleBan={handleBanToggle}
      />

      <OwnerUserFormDialog
        open={isDialogOpen}
        mode={dialogMode}
        value={formValues}
        errors={formErrors}
        branches={branches}
        submitting={isSubmitting}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        onChange={onChangeField}
        onSubmit={submitForm}
      />
    </PortalShell>
  );
};
