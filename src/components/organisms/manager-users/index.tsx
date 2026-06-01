"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptText, Settings, Soup, UserPlus, Users } from "lucide-react";

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
  const [form, setForm] = useState<ManagerUserFormValues>(EMPTY_FORM);

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
    setForm(EMPTY_FORM);
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setForm({
      ...EMPTY_FORM,
      branchIds: branches.map((branch) => branch.branchId),
    });
    setFormMode("create");
    setDialogOpen(true);
  };

  const openEditDialog = (user: ManagerScopedUserResponse) => {
    setEditingUser(user);
    setFormMode("edit");
    setForm({
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

    if (message === "Branch is outside your managed scope.") {
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
        message: `The action succeeded, but the latest user list could not be refreshed. ${getErrorMessage(error)}`,
        duration: 4000,
      });
    }

    onSuccess();
  };

  const handleSubmit = async () => {
    setForbiddenMessage("");

    if (
      !form.fullName.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.role ||
      form.branchIds.length === 0 ||
      (formMode === "create" && !form.password.trim())
    ) {
      showNotify({
        type: "warning",
        message: "Please complete all required fields.",
      });
      return;
    }

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          password: form.password.trim(),
          role: form.role,
          branchIds: form.branchIds,
        });

        await handleRefreshAfterMutation("User created successfully.", closeDialog);
        return;
      }

      if (!editingUser) {
        showNotify({
          type: "error",
          message:
            "Unable to update this user because the selected record is missing. Please reopen the dialog and try again.",
          duration: 4000,
        });
        closeDialog();
        return;
      }

      const payload: UpdateManagerUserRequest = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        role: form.role,
        branchIds: form.branchIds,
      };

      await updateMutation.mutateAsync({ id: editingUser.userId, data: payload });
      await handleRefreshAfterMutation("User updated successfully.", closeDialog);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleBanToggle = async (user: ManagerScopedUserResponse) => {
    setForbiddenMessage("");

    try {
      if (user.isBanned) {
        await unbanMutation.mutateAsync(user.userId);
        await handleRefreshAfterMutation("User unbanned successfully.", () => undefined);
        return;
      }

      await banMutation.mutateAsync(user.userId);
      await handleRefreshAfterMutation("User banned successfully.", () => undefined);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleFieldChange = (field: keyof ManagerUserFormValues, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleBranchToggle = (nextBranchId: string) => {
    setForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(nextBranchId)
        ? current.branchIds.filter((branch) => branch !== nextBranchId)
        : [...current.branchIds, nextBranchId],
    }));
  };

  useEffect(() => {
    setPageNumber(1);
  }, [search]);

  const roleFilterLabel = getRoleFilterLabel(role);
  const branchFilterLabel = getBranchFilterLabel(branchId, branches);
  const statusFilterLabel = getStatusFilterLabel(status);
  const queryErrorMessage = usersQuery.isError ? getErrorMessage(usersQuery.error) : "";
  const branchesErrorMessage = branchesQuery.isError ? getErrorMessage(branchesQuery.error) : "";
  const managerHasNoBranch = queryErrorMessage === "Manager has no branch";
  const roleFilterOptions = [
    { label: "All roles", value: "" },
    ...ROLE_OPTIONS.map((option) => ({ label: getRoleFilterLabel(option), value: option })),
  ];
  const branchFilterOptions = [
    { label: "All branches", value: "" },
    ...branches.map((branch) => ({ label: branch.name, value: branch.branchId })),
  ];

  if (!isAuthInitialized) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">Loading...</div>
      </main>
    );
  }

  if (!canAccessManagerUsers) {
    return null;
  }

  if (!currentUser) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">Loading...</div>
      </main>
    );
  }

  return (
    <PortalShell
      title="Staff Management"
      description="Manage and monitor your branch employees and kitchen staff."
      portalLabel="Branch Portal"
      portalName="Branch Manager Console"
      navItems={[
        {
          label: "Staff Management",
          href: PATH.manager.users,
          icon: <Users className="size-4" />,
          active: true,
        },
        { label: "Orders", href: PATH.manager.orders, icon: <ReceiptText className="size-4" /> },
        { label: "Inventory", href: PATH.manager.inventory, icon: <Soup className="size-4" /> },
        { label: "Settings", href: PATH.manager.settings, icon: <Settings className="size-4" /> },
      ]}
      topbarTitle="Branch Manager Console"
      currentUser={currentUser}
      headerAction={
        <Button className="h-12 px-8" onClick={openCreateDialog} disabled={branchesQuery.isError}>
          <UserPlus className="size-4" />
          Create User
        </Button>
      }
      stats={
        <>
          <PortalStatCard
            label="Total Staff"
            value={String(totalUsers)}
            helper="Users returned from backend"
          />
          <PortalStatCard
            label="Kitchen Crew"
            value={String(kitchenCrewCount)}
            helper="Kitchen accounts in current scope"
          />
          <PortalStatCard
            label="Active Today"
            value={String(activeTodayCount)}
            helper="Active and not banned accounts"
          />
          <PortalStatCard
            label="Banned"
            value={String(bannedCount)}
            helper="Accounts currently restricted"
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
          Failed to load managed branches. {branchesErrorMessage}
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
        form={form}
        mode={formMode}
        open={dialogOpen}
        showBranchSelection={false}
        onBranchToggle={handleBranchToggle}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        onChange={handleFieldChange}
        pending={pending}
      />
    </PortalShell>
  );
};
