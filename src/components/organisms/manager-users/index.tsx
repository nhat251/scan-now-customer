"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText, Settings, Soup, UserPlus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import {
  getBranchFilterLabel,
  getErrorMessage,
  getRoleFilterLabel,
  getScopeErrorBanner,
  getStatusFilterLabel,
  getStatusFilterPayload,
} from "@/components/organisms/manager-users/helpers";
import { ManagerUsersToolbar } from "@/components/organisms/manager-users/manager-users-toolbar";
import {
  type FormMode,
  UserFormDialog,
} from "@/components/organisms/manager-users/user-form-dialog";
import { ManagerUsersTable } from "@/components/organisms/manager-users/users-table";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { QUERY_KEY } from "@/constants/queryKeys";
import {
  useBanManagerUserMutation,
  useCreateManagerUserMutation,
  useUnbanManagerUserMutation,
  useUpdateManagerUserMutation,
} from "@/hooks/mutations/useManagerUserMutations";
import { useManagerUsersQuery, useMyBranchesQuery } from "@/hooks/queries/useManagerUsersQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type {
  ManagerScopedUserResponse,
  ManagerUserFormValues,
  UpdateManagerUserRequest,
  UserStatusFilter,
} from "@/types/user-management";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_OPTIONS = ["STAFF", "KITCHEN", "CASHIER"] as const;

const EMPTY_FORM: ManagerUserFormValues = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "STAFF",
  branchIds: [],
};

const getManagerUserSchema = (mode: FormMode) => {
  return z.object({
    fullName: z.string().trim().min(1, "Họ tên là bắt buộc."),
    username: z.string().trim().min(1, "Tên đăng nhập là bắt buộc."),
    email: z.string().trim().min(1, "Email là bắt buộc.").email("Email không hợp lệ."),
    phoneNumber: z.string(),
    password: mode === "create" ? z.string().min(1, "Mật khẩu là bắt buộc.") : z.string(),
    role: z.enum(["STAFF", "KITCHEN", "CASHIER"]),
    branchIds: z.array(z.string()).min(1, "Chọn ít nhất một chi nhánh."),
  });
};

export const ManagerUsersPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.user);
  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const isLogin = useUserStore((state) => state.isLogin);
  const userRole = useUserStore((state) => state.user?.role);
  const isManager = userRole === "BRANCH_MANAGER";

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim());
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [role, setRole] = useState<string>("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState<UserStatusFilter>("all");
  const [forbiddenMessage, setForbiddenMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingUser, setEditingUser] = useState<ManagerScopedUserResponse | null>(null);

  const {
    register,
    control,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ManagerUserFormValues>({
    resolver: (values, context, options) => {
      return zodResolver(getManagerUserSchema(formMode))(values, context, options);
    },
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!isLogin || !isManager) {
      router.replace(PATH.auth.login);
    }
  }, [isAuthInitialized, isLogin, isManager, router]);

  const filterPayload = useMemo(() => getStatusFilterPayload(status), [status]);
  const canAccessManagerUsers = isLogin && isManager;
  const branchesQuery = useMyBranchesQuery(canAccessManagerUsers);

  const usersQuery = useManagerUsersQuery(
    {
      pageNumber,
      pageSize,
      search: search || undefined,
      role: role || undefined,
      branchId: branchId || undefined,
      ...filterPayload,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    canAccessManagerUsers && branchesQuery.data !== undefined
  );

  const createMutation = useCreateManagerUserMutation();
  const updateMutation = useUpdateManagerUserMutation();
  const banMutation = useBanManagerUserMutation();
  const unbanMutation = useUnbanManagerUserMutation();

  const users = usersQuery.data?.items ?? [];
  const branches = branchesQuery.data ?? [];
  const totalPages = usersQuery.data?.totalPages ?? 0;
  const totalUsers = usersQuery.data?.totalItems ?? 0;
  const pending =
    createMutation.isPending ||
    updateMutation.isPending ||
    banMutation.isPending ||
    unbanMutation.isPending;

  const kitchenCrewCount = users.filter((user) => user.role === "KITCHEN").length;
  const activeTodayCount = users.filter((user) => user.isActive && !user.isBanned).length;
  const bannedCount = users.filter((user) => user.isBanned).length;

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGER_USERS] });
    return usersQuery.refetch();
  };

  const clampPageAfterMutation = (nextTotalPages?: number) => {
    if (!nextTotalPages) {
      return;
    }

    setPageNumber((currentPage) => Math.min(currentPage, Math.max(nextTotalPages, 1)));
  };

  const resetForm = () => {
    reset(EMPTY_FORM);
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    reset({
      ...EMPTY_FORM,
      branchIds: branches.map((branch) => branch.branchId),
    });
    setFormMode("create");
    setDialogOpen(true);
  };

  const openEditDialog = (user: ManagerScopedUserResponse) => {
    setEditingUser(user);
    setFormMode("edit");
    reset({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
      password: "",
      role: user.role,
      branchIds: user.branchIds,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleApiError = (error: unknown) => {
    const message = getErrorMessage(error);

    if (message === "Chi nhánh nằm ngoài phạm vi quản lý của bạn.") {
      setForbiddenMessage(getScopeErrorBanner(message));
    }

    showNotify({
      type: "error",
      message,
      duration: 3000,
    });
  };

  const handleRefreshAfterMutation = async (successMessage: string, onSuccess: () => void) => {
    showNotify({ type: "success", message: successMessage });

    try {
      const refreshResult = await refreshUsers();
      clampPageAfterMutation(refreshResult.data?.totalPages);
    } catch (error) {
      showNotify({
        type: "warning",
        message: `Thao tác đã thành công nhưng chưa thể tải lại danh sách nhân sự mới nhất. ${getErrorMessage(error)}`,
        duration: 4000,
      });
    }

    onSuccess();
  };

  const onSubmitForm = async (values: ManagerUserFormValues) => {
    setForbiddenMessage("");

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({
          fullName: values.fullName.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          phoneNumber: values.phoneNumber.trim() || undefined,
          password: values.password.trim(),
          role: values.role,
          branchIds: values.branchIds,
        });

        await handleRefreshAfterMutation("Đã tạo nhân sự.", closeDialog);
        return;
      }

      if (!editingUser) {
        showNotify({
          type: "error",
          message:
            "Không thể cập nhật vì thiếu dữ liệu nhân sự đã chọn. Vui lòng mở lại hộp thoại và thử lại.",
          duration: 4000,
        });
        closeDialog();
        return;
      }

      const payload: UpdateManagerUserRequest = {
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim() || undefined,
        role: values.role,
        branchIds: values.branchIds,
      };

      await updateMutation.mutateAsync({ id: editingUser.userId, data: payload });
      await handleRefreshAfterMutation("Đã cập nhật nhân sự.", closeDialog);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleBanToggle = async (user: ManagerScopedUserResponse) => {
    setForbiddenMessage("");

    try {
      if (user.isBanned) {
        await unbanMutation.mutateAsync(user.userId);
        await handleRefreshAfterMutation("Đã mở khóa nhân sự.", () => undefined);
        return;
      }

      await banMutation.mutateAsync(user.userId);
      await handleRefreshAfterMutation("Đã khóa nhân sự.", () => undefined);
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    setPageNumber(1);
  }, [search]);

  const roleFilterLabel = getRoleFilterLabel(role);
  const branchFilterLabel = getBranchFilterLabel(branchId, branches);
  const statusFilterLabel = getStatusFilterLabel(status);
  const queryErrorMessage = usersQuery.isError ? getErrorMessage(usersQuery.error) : "";
  const branchesErrorMessage = branchesQuery.isError ? getErrorMessage(branchesQuery.error) : "";
  const managerHasNoBranch = queryErrorMessage === "Tài khoản quản lý chưa được gán chi nhánh.";
  const roleFilterOptions = [
    { label: "Tất cả vai trò", value: "" },
    ...ROLE_OPTIONS.map((option) => ({ label: getRoleFilterLabel(option), value: option })),
  ];
  const branchFilterOptions = [
    { label: "Tất cả chi nhánh", value: "" },
    ...branches.map((branch) => ({ label: branch.name, value: branch.branchId })),
  ];

  if (!isAuthInitialized) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">Đang tải...</div>
      </main>
    );
  }

  if (!canAccessManagerUsers) {
    return null;
  }

  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">Đang tải...</div>
      </main>
    );
  }

  return (
    <PortalShell
      title="Quản lý nhân sự"
      description="Quản lý và theo dõi nhân viên phục vụ, thu ngân và nhân viên bếp."
      portalLabel="Khu vực chi nhánh"
      portalName="Khu vực quản lý chi nhánh"
      navItems={[
        {
          label: "Quản lý nhân sự",
          href: PATH.manager.users,
          icon: <Users className="size-4" />,
          active: true,
        },
        { label: "Đơn hàng", href: PATH.manager.orders, icon: <ReceiptText className="size-4" /> },
        { label: "Kho hàng", href: PATH.manager.inventory, icon: <Soup className="size-4" /> },
        { label: "Cài đặt", href: PATH.manager.settings, icon: <Settings className="size-4" /> },
      ]}
      topbarTitle="Khu vực quản lý chi nhánh"
      currentUser={currentUser}
      headerAction={
        <Button className="h-12 px-8" onClick={openCreateDialog} disabled={branchesQuery.isError}>
          <UserPlus className="size-4" />
          Tạo nhân sự
        </Button>
      }
      stats={
        <>
          <PortalStatCard
            label="Tổng nhân sự"
            value={String(totalUsers)}
            helper="Số nhân sự từ hệ thống"
          />
          <PortalStatCard
            label="Nhân viên bếp"
            value={String(kitchenCrewCount)}
            helper="Tài khoản bếp trong phạm vi hiện tại"
          />
          <PortalStatCard
            label="Đang hoạt động"
            value={String(activeTodayCount)}
            helper="Tài khoản hoạt động và không bị khóa"
          />
          <PortalStatCard
            label="Đã khóa"
            value={String(bannedCount)}
            helper="Tài khoản đang bị hạn chế"
          />
        </>
      }
    >
      {forbiddenMessage && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          {forbiddenMessage}
        </div>
      )}

      <ManagerUsersToolbar
        branchFilterLabel={branchFilterLabel}
        branchFilterOptions={branchFilterOptions}
        branchValue={branchId}
        roleFilterLabel={roleFilterLabel}
        roleFilterOptions={roleFilterOptions}
        roleValue={role}
        searchInput={searchInput}
        status={status}
        statusFilterLabel={statusFilterLabel}
        onBranchChange={(nextBranchId) => {
          setPageNumber(1);
          setBranchId(nextBranchId);
        }}
        onRoleChange={(nextRole) => {
          setPageNumber(1);
          setRole(nextRole);
        }}
        onSearchChange={setSearchInput}
        onStatusChange={(nextStatus) => {
          setPageNumber(1);
          setStatus(nextStatus);
        }}
      />

      {branchesQuery.isError && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          Không thể tải chi nhánh được quản lý. {branchesErrorMessage}
        </div>
      )}

      <ManagerUsersTable
        users={users}
        isError={usersQuery.isError}
        isFetching={usersQuery.isFetching}
        isLoading={usersQuery.isLoading}
        managerHasNoBranch={managerHasNoBranch}
        pageNumber={usersQuery.data?.pageNumber ?? pageNumber}
        pageSize={pageSize}
        queryErrorMessage={queryErrorMessage}
        totalPages={totalPages}
        totalUsers={totalUsers}
        onEditUser={openEditDialog}
        onPageChange={setPageNumber}
        onPageSizeChange={(nextPageSize) => {
          setPageNumber(1);
          setPageSize(nextPageSize);
        }}
        onToggleBan={handleBanToggle}
      />

      <UserFormDialog
        branches={branches}
        register={register}
        control={control}
        errors={errors}
        setValue={setValue}
        mode={formMode}
        open={dialogOpen}
        showBranchSelection={false}
        onClose={closeDialog}
        onSubmit={handleFormSubmit(onSubmitForm)}
        pending={pending}
      />
    </PortalShell>
  );
};
