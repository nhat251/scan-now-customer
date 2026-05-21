"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { ChevronDown, MoreHorizontal, Search, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { PATH } from "@/constants/path";
import { QUERY_KEY } from "@/constants/queryKeys";
import {
  useBanManagerUserMutation,
  useCreateManagerUserMutation,
  useUnbanManagerUserMutation,
  useUpdateManagerUserMutation,
} from "@/hooks/mutations/useManagerUserMutations";
import { useManagerUsersQuery, useMyBranchesQuery } from "@/hooks/queries/useManagerUsersQuery";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type {
  BranchResponse,
  ManagerScopedUserResponse,
  UpdateManagedUserRequest,
  UserFormValues,
  UserRoleOption,
  UserStatusFilter,
} from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_OPTIONS: UserRoleOption[] = ["STAFF", "KITCHEN"];
const PAGE_SIZES = [10, 25, 50] as const;
const STATUS_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Banned", value: "banned" },
];

const EMPTY_FORM: UserFormValues = {
  fullName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "STAFF",
  branchIds: [],
};

type ApiErrorPayload = {
  message?: string;
};

type FormMode = "create" | "edit";

type FilterDropdownProps<TValue extends string> = {
  id: string;
  label: string;
  value: TValue;
  displayValue: string;
  options: Array<{ label: string; value: TValue }>;
  onValueChange: (value: TValue) => void;
};

const getStatusFilterPayload = (status: UserStatusFilter) => {
  if (status === "active") {
    return { isActive: true, isBanned: false };
  }

  if (status === "inactive") {
    return { isActive: false, isBanned: false };
  }

  if (status === "banned") {
    return { isBanned: true };
  }

  return {};
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorPayload | undefined)?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Oops, an error occurred!";
};

const getScopeErrorBanner = (message: string) => {
  return message === "Branch is outside your managed scope." ? `403 ${message}` : message;
};

const FilterDropdown = <TValue extends string>({
  id,
  label,
  value,
  displayValue,
  options,
  onValueChange,
}: FilterDropdownProps<TValue>) => {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button id={id} variant="outline" className="w-full justify-between rounded-md px-3 font-normal">
              <span className="truncate">{displayValue}</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
            <DropdownMenuRadioGroup value={value} onValueChange={(nextValue) => onValueChange(nextValue as TValue)}>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </FieldContent>
    </Field>
  );
};

const BranchMultiSelect = ({
  branches,
  selectedBranchIds,
  onBranchToggle,
}: {
  branches: BranchResponse[];
  selectedBranchIds: string[];
  onBranchToggle: (branchId: string) => void;
}) => {
  const selectedCount = selectedBranchIds.length;
  const triggerLabel =
    selectedCount === 0
      ? "Select managed branches"
      : selectedCount === 1
        ? branches.find((branch) => branch.branchId === selectedBranchIds[0])?.name ?? "1 branch selected"
        : `${selectedCount} branches selected`;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Managed branches</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between rounded-md px-3 font-normal">
            <span className="truncate">{triggerLabel}</span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
          <DropdownMenuLabel>Select branches</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {branches.map((branch) => (
            <DropdownMenuCheckboxItem
              key={branch.branchId}
              checked={selectedBranchIds.includes(branch.branchId)}
              onCheckedChange={() => onBranchToggle(branch.branchId)}
            >
              {branch.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {branches
            .filter((branch) => selectedBranchIds.includes(branch.branchId))
            .map((branch) => (
              <Tag key={branch.branchId} tagString={branch.name} />
            ))}
        </div>
      )}
    </div>
  );
};

const UserFormDialog = ({
  branches,
  form,
  mode,
  open,
  onBranchToggle,
  onClose,
  onSubmit,
  onChange,
  pending,
}: {
  branches: BranchResponse[];
  form: UserFormValues;
  mode: FormMode;
  open: boolean;
  onBranchToggle: (branchId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: keyof UserFormValues, value: string) => void;
  pending: boolean;
}) => {
  const selectedRoleLabel = ROLE_OPTIONS.find((role) => role === form.role) ?? "Select role";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create user" : "Update user"}</DialogTitle>
          <DialogDescription>
            Branch Managers can manage STAFF and KITCHEN users within their managed branches.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <FieldContent>
                <Input id="fullName" value={form.fullName} onChange={(event) => onChange("fullName", event.target.value)} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldContent>
                <Input id="username" value={form.username} onChange={(event) => onChange("username", event.target.value)} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => onChange("email", event.target.value)}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
              <FieldContent>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(event) => onChange("phoneNumber", event.target.value)}
                />
              </FieldContent>
            </Field>

            <FilterDropdown
              id="role"
              label="Role"
              value={form.role}
              displayValue={selectedRoleLabel}
              options={ROLE_OPTIONS.map((roleOption) => ({ label: roleOption, value: roleOption }))}
              onValueChange={(nextRole) => onChange("role", nextRole)}
            />

            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => onChange("password", event.target.value)}
                  />
                </FieldContent>
              </Field>
            )}
          </FieldGroup>
        </div>

        <BranchMultiSelect
          branches={branches}
          selectedBranchIds={form.branchIds}
          onBranchToggle={onBranchToggle}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ManagerUsersPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLogin = useUserStore((state) => state.isLogin);
  const userRole = useUserStore((state) => state.user?.role);
  const isManager = userRole === "BRANCH_MANAGER";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [role, setRole] = useState<string>("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState<UserStatusFilter>("all");
  const [forbiddenMessage, setForbiddenMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingUser, setEditingUser] = useState<ManagerScopedUserResponse | null>(null);
  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!isLogin || !isManager) {
      router.replace(PATH.auth.login);
    }
  }, [isLogin, isManager, router]);

  const filterPayload = useMemo(() => getStatusFilterPayload(status), [status]);

  const canAccessManagerUsers = isLogin && isManager;

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
    canAccessManagerUsers
  );

  const branchesQuery = useMyBranchesQuery(canAccessManagerUsers);
  const createMutation = useCreateManagerUserMutation();
  const updateMutation = useUpdateManagerUserMutation();
  const banMutation = useBanManagerUserMutation();
  const unbanMutation = useUnbanManagerUserMutation();

  const users = usersQuery.data?.items ?? [];
  const branches = branchesQuery.data ?? [];
  const totalPages = usersQuery.data?.totalPages ?? 0;
  const pending =
    createMutation.isPending ||
    updateMutation.isPending ||
    banMutation.isPending ||
    unbanMutation.isPending;

  const invalidateUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MANAGER_USERS] });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
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
      role: user.role as UserRoleOption,
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
      await invalidateUsers();
    } catch {
      showNotify({
        type: "warning",
        message: "The action succeeded, but the latest user list could not be refreshed.",
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

      if (formMode === "edit" && editingUser) {
        const payload: UpdateManagedUserRequest = {
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          role: form.role,
          branchIds: form.branchIds,
        };

        await updateMutation.mutateAsync({ id: editingUser.userId, data: payload });
        await handleRefreshAfterMutation("User updated successfully.", closeDialog);
      }
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

  const handleFieldChange = (field: keyof UserFormValues, value: string) => {
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

  const handleSearchSubmit = () => {
    setPageNumber(1);
    setSearch(searchInput.trim());
  };

  const roleFilterLabel = role || "All roles";
  const selectedBranchName = branches.find((branch) => branch.branchId === branchId)?.name;
  const branchFilterLabel = branchId ? selectedBranchName ?? "Selected branch" : "All managed branches";
  const statusFilterLabel = STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "All";
  const pageSizeLabel = String(pageSize);
  const queryErrorMessage = usersQuery.isError ? getErrorMessage(usersQuery.error) : "";
  const branchesErrorMessage = branchesQuery.isError ? getErrorMessage(branchesQuery.error) : "";

  if (!canAccessManagerUsers) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border p-6 text-sm shadow-sm">Redirecting...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Route: {PATH.manager.users}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage STAFF and KITCHEN accounts within your managed branches.</p>
        </div>

        <Button onClick={openCreateDialog} disabled={branchesQuery.isError}>
          <UserPlus className="size-4" />
          Create user
        </Button>
      </div>

      {forbiddenMessage && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          {forbiddenMessage}
        </div>
      )}

      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[2fr_repeat(4,1fr)]">
          <Field>
            <FieldLabel htmlFor="search">Search</FieldLabel>
            <FieldContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="search"
                    className="pl-9"
                    placeholder="Search by name, username, email, phone, branch"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                  />
                </div>
                <Button variant="outline" onClick={handleSearchSubmit}>
                  Search
                </Button>
              </div>
            </FieldContent>
          </Field>

          <FilterDropdown
            id="role-filter"
            label="Role"
            value={role}
            displayValue={roleFilterLabel}
            options={[{ label: "All roles", value: "" }, ...ROLE_OPTIONS.map((option) => ({ label: option, value: option }))]}
            onValueChange={(nextRole) => {
              setPageNumber(1);
              setRole(nextRole);
            }}
          />

          <FilterDropdown
            id="branch-filter"
            label="Branch"
            value={branchId}
            displayValue={branchFilterLabel}
            options={[
              { label: "All managed branches", value: "" },
              ...branches.map((branch) => ({ label: branch.name, value: branch.branchId })),
            ]}
            onValueChange={(nextBranchId) => {
              setPageNumber(1);
              setBranchId(nextBranchId);
            }}
          />

          <FilterDropdown
            id="status-filter"
            label="Status"
            value={status}
            displayValue={statusFilterLabel}
            options={STATUS_OPTIONS}
            onValueChange={(nextStatus) => {
              setPageNumber(1);
              setStatus(nextStatus);
            }}
          />

          <FilterDropdown
            id="page-size"
            label="Page size"
            value={pageSizeLabel}
            displayValue={pageSizeLabel}
            options={PAGE_SIZES.map((size) => ({ label: String(size), value: String(size) }))}
            onValueChange={(nextPageSize) => {
              setPageNumber(1);
              setPageSize(Number(nextPageSize));
            }}
          />
        </div>
      </section>

      {branchesQuery.isError && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          Failed to load managed branches. {branchesErrorMessage}
        </div>
      )}

      <section className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Full name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email / Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Branches</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <td className="text-muted-foreground px-4 py-8 text-center" colSpan={8}>
                    Loading users...
                  </td>
                </tr>
              ) : usersQuery.isError ? (
                <tr>
                  <td className="text-destructive px-4 py-8 text-center" colSpan={8}>
                    Failed to load users. {queryErrorMessage}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="text-muted-foreground px-4 py-8 text-center" colSpan={8}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="border-t align-top">
                    <td className="px-4 py-4 font-medium">{user.fullName}</td>
                    <td className="px-4 py-4">{user.username}</td>
                    <td className="px-4 py-4">
                      <div>{user.email}</div>
                      <div className="text-muted-foreground">{user.phoneNumber || "-"}</div>
                    </td>
                    <td className="px-4 py-4">{user.role}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.branchNames.map((branchName) => (
                          <Tag key={`${user.userId}-${branchName}`} tagString={branchName} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Tag tagString={user.isBanned ? "Banned" : user.isActive ? "Active" : "Inactive"} />
                      </div>
                    </td>
                    <td className="px-4 py-4">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${user.fullName}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>Update user</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBanToggle(user)}
                            className={cn(user.isBanned ? "" : "text-destructive")}
                          >
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

        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Page {usersQuery.data?.pageNumber ?? pageNumber} of {Math.max(totalPages, 1)} · {usersQuery.data?.totalItems ?? 0} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={pageNumber <= 1 || usersQuery.isFetching || usersQuery.isError}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPageNumber((current) => current + 1)}
              disabled={usersQuery.isFetching || usersQuery.isError || (totalPages > 0 ? pageNumber >= totalPages : users.length < pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <UserFormDialog
        branches={branches}
        form={form}
        mode={formMode}
        open={dialogOpen}
        onBranchToggle={handleBranchToggle}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        onChange={handleFieldChange}
        pending={pending}
      />
    </main>
  );
};
