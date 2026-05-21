"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Ban,
  CheckCircle2,
  ChevronsUpDown,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  UserCog,
} from "lucide-react";

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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PATH } from "@/constants/path";
import { useBanOwnerUserMutation, useCreateOwnerUserMutation, useUnbanOwnerUserMutation, useUpdateOwnerUserMutation } from "@/hooks/mutations/useOwnerUserMutations";
import { useOwnerBranchesQuery } from "@/hooks/queries/useOwnerBranchesQuery";
import { useOwnerUsersQuery } from "@/hooks/queries/useOwnerUsersQuery";
import { cn } from "@/lib/utils";
import type {
  BranchResponse,
  ManagedUserRole,
  OwnerScopedUserResponse,
  UserFormValues,
  UserListQuery,
  UserStatusFilter,
} from "@/types/user-management";

const ROLE_OPTIONS: ManagedUserRole[] = ["BRANCH_MANAGER", "STAFF", "KITCHEN"];
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", sortDirection: "desc" as const },
  { label: "Oldest first", sortBy: "createdAt", sortDirection: "asc" as const },
  { label: "Name A-Z", sortBy: "fullName", sortDirection: "asc" as const },
  { label: "Name Z-A", sortBy: "fullName", sortDirection: "desc" as const },
  { label: "Role A-Z", sortBy: "role", sortDirection: "asc" as const },
  { label: "Role Z-A", sortBy: "role", sortDirection: "desc" as const },
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

type UserFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  value: UserFormValues;
  errors: Partial<Record<keyof UserFormValues, string>>;
  branches: BranchResponse[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => void;
  onSubmit: () => void;
};

const statusFilterToQuery = (status: UserStatusFilter) => {
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

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const getStatusBadge = (user: OwnerScopedUserResponse) => {
  if (user.isBanned) {
    return "Banned";
  }

  return user.isActive ? "Active" : "Inactive";
};

const getSortOptionLabel = (sortBy: string, sortDirection: "asc" | "desc") => {
  return (
    SORT_OPTIONS.find((option) => option.sortBy === sortBy && option.sortDirection === sortDirection)?.label ??
    "Sort"
  );
};

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Banned", value: "banned" },
];

const getRoleFilterLabel = (role: string) => {
  return role === "all" ? "All roles" : role;
};

const getBranchFilterLabel = (branchId: string, branches: BranchResponse[]) => {
  if (branchId === "all") {
    return "All branches";
  }

  return branches.find((branch) => branch.branchId === branchId)?.name ?? "Select branch";
};

const getStatusFilterLabel = (status: UserStatusFilter) => {
  return STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ?? "All statuses";
};

const getPageSizeLabel = (size: number) => {
  return `${size} / page`;
};

const UserFormDialog = ({
  open,
  mode,
  value,
  errors,
  branches,
  submitting,
  onOpenChange,
  onChange,
  onSubmit,
}: UserFormDialogProps) => {
  const selectedBranchSet = useMemo(() => new Set(value.branchIds), [value.branchIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create user" : "Update user"}</DialogTitle>
          <DialogDescription>
            Owners can manage branch managers, staff, and kitchen users inside their restaurant.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <FieldContent>
                <Input
                  id="fullName"
                  value={value.fullName}
                  onChange={(event) => onChange("fullName", event.target.value)}
                  placeholder="Enter full name"
                  aria-invalid={!!errors.fullName}
                />
                <FieldError>{errors.fullName}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldContent>
                <Input
                  id="username"
                  value={value.username}
                  onChange={(event) => onChange("username", event.target.value)}
                  placeholder="Enter username"
                  aria-invalid={!!errors.username}
                />
                <FieldError>{errors.username}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  value={value.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
              <FieldContent>
                <Input
                  id="phoneNumber"
                  value={value.phoneNumber}
                  onChange={(event) => onChange("phoneNumber", event.target.value)}
                  placeholder="Optional phone number"
                  aria-invalid={!!errors.phoneNumber}
                />
                <FieldError>{errors.phoneNumber}</FieldError>
              </FieldContent>
            </Field>

            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    value={value.password}
                    onChange={(event) => onChange("password", event.target.value)}
                    placeholder="Enter password"
                    aria-invalid={!!errors.password}
                  />
                  <FieldError>{errors.password}</FieldError>
                </FieldContent>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button id="role" variant="outline" className="w-full justify-between" aria-invalid={!!errors.role}>
                      {value.role}
                      <ChevronsUpDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                    <DropdownMenuRadioGroup value={value.role} onValueChange={(nextRole) => onChange("role", nextRole as ManagedUserRole)}>
                      {ROLE_OPTIONS.map((role) => (
                        <DropdownMenuRadioItem key={role} value={role}>
                          {role}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldError>{errors.role}</FieldError>
              </FieldContent>
            </Field>

          </div>

          <Field>
            <FieldLabel>Branch assignment</FieldLabel>
            <FieldContent>
              <div className="border-border/70 grid gap-3 rounded-2xl border p-4 md:grid-cols-2">
                {branches.map((branch) => {
                  const checked = selectedBranchSet.has(branch.branchId);

                  return (
                    <DropdownMenu key={branch.branchId}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto justify-start rounded-2xl px-3 py-3 text-left",
                            checked
                              ? "border-primary-container bg-primary-container/5"
                              : "border-border/70 hover:bg-surface-container-low"
                          )}
                        >
                          <div>
                            <p className="font-medium">{branch.name}</p>
                            <p className="text-muted-foreground text-xs">{branch.address || branch.email || branch.slug}</p>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuCheckboxItem
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            const shouldCheck = nextChecked === true;
                            const nextBranchIds = shouldCheck
                              ? [...value.branchIds, branch.branchId]
                              : value.branchIds.filter((branchId) => branchId !== branch.branchId);

                            onChange("branchIds", nextBranchIds);
                          }}
                        >
                          Assign {branch.name}
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}
              </div>
              <FieldError>{errors.branchIds}</FieldError>
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const OwnerUsersPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
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
  const branches = branchesQuery.data;
  const totalItems = usersQuery.data?.totalItems ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 1;
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || banMutation.isPending || unbanMutation.isPending;

  const resetForm = () => {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingUser(null);
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
      nextErrors.fullName = "Full name is required.";
    }

    if (!formValues.username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (dialogMode === "create" && !formValues.password.trim()) {
      nextErrors.password = "Password is required.";
    }

    if (!formValues.branchIds.length) {
      nextErrors.branchIds = "Select at least one branch.";
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

      setIsDialogOpen(false);
      resetForm();
      return;
    }

    if (!editingUser) {
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

    setIsDialogOpen(false);
    resetForm();
  };

  const handleBanToggle = async (user: OwnerScopedUserResponse) => {
    if (user.isBanned) {
      await unbanMutation.mutateAsync({ id: user.userId });
      return;
    }

    await banMutation.mutateAsync({ id: user.userId });
  };

  const applySearch = () => {
    setPageNumber(1);
    setSearch(searchInput.trim());
  };

  const onChangeField = <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => {
    setFormValues((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  };

  const visibleRangeStart = totalItems === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const visibleRangeEnd = Math.min(pageNumber * pageSize, totalItems);
  const hasAuthFailure = usersQuery.isError || branchesQuery.isError;

  if (hasAuthFailure) {
    return (
      <div className="bg-background min-h-screen">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 md:px-8">
          <div className="border-border/60 bg-card rounded-[2rem] border p-8 shadow-sm">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Owner portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">User Management</h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              We could not load your owner access or restaurant data. Your session may be expired or no longer valid.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={async () => {
                  await Promise.all([usersQuery.refetch(), branchesQuery.refetch()]);
                }}
                disabled={usersQuery.isRefetching || branchesQuery.isRefetching}
              >
                Try again
              </Button>
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Go to login
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 md:px-8">
        <div className="border-border/60 bg-card flex flex-col gap-4 rounded-[2rem] border p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Owner portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">User Management</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
              Manage branch managers, staff, and kitchen users across your restaurant branches.
            </p>
          </div>

          <Button size="lg" onClick={openCreateDialog}>
            <Plus />
            Create user
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[2fr_repeat(4,1fr)]">
          <div className="bg-card border-border/60 rounded-[2rem] border p-4 shadow-sm xl:col-span-2">
            <label className="text-sm font-medium" htmlFor="owner-users-search">
              Search
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="owner-users-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applySearch();
                    }
                  }}
                  className="pl-9"
                  placeholder="Search by name, username, email, phone, branch"
                />
              </div>
              <Button variant="outline" onClick={applySearch}>
                Search
              </Button>
            </div>
          </div>

          <div className="bg-card border-border/60 rounded-[2rem] border p-4 shadow-sm">
            <label className="text-sm font-medium">Role</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-2 w-full justify-between">
                  {getRoleFilterLabel(roleFilter)}
                  <ChevronsUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setPageNumber(1);
                  }}
                >
                  <DropdownMenuRadioItem value="all">All roles</DropdownMenuRadioItem>
                  {ROLE_OPTIONS.map((role) => (
                    <DropdownMenuRadioItem key={role} value={role}>
                      {role}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="bg-card border-border/60 rounded-[2rem] border p-4 shadow-sm">
            <label className="text-sm font-medium">Branch</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-2 w-full justify-between">
                  {getBranchFilterLabel(branchFilter, branches ?? [])}
                  <ChevronsUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup
                  value={branchFilter}
                  onValueChange={(value) => {
                    setBranchFilter(value);
                    setPageNumber(1);
                  }}
                >
                  <DropdownMenuRadioItem value="all">All branches</DropdownMenuRadioItem>
                  {(branches ?? []).map((branch) => (
                    <DropdownMenuRadioItem key={branch.branchId} value={branch.branchId}>
                      {branch.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="bg-card border-border/60 rounded-[2rem] border p-4 shadow-sm">
            <label className="text-sm font-medium">Status</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-2 w-full justify-between">
                  {getStatusFilterLabel(statusFilter)}
                  <ChevronsUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as UserStatusFilter);
                    setPageNumber(1);
                  }}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="bg-card border-border/60 rounded-[2rem] border p-4 shadow-sm">
            <label className="text-sm font-medium">Page size</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-2 w-full justify-between">
                  {getPageSizeLabel(pageSize)}
                  <ChevronsUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPageNumber(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <DropdownMenuRadioItem key={size} value={String(size)}>
                      {getPageSizeLabel(size)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="bg-card border-border/60 overflow-hidden rounded-[2rem] border shadow-sm">
          <div className="border-border/60 flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-muted-foreground text-sm">
                Showing {visibleRangeStart}-{visibleRangeEnd} of {totalItems} users
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                      onClick={() => {
                        setSortBy(option.sortBy);
                        setSortDirection(option.sortDirection);
                        setPageNumber(1);
                      }}
                    >
                      {option.sortDirection === "asc" ? <ArrowDownAZ /> : <ArrowUpAZ />}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="divide-border/60 min-w-full divide-y">
              <thead className="bg-surface-container-low text-left">
                <tr>
                  <th className="text-muted-foreground px-6 py-4 text-sm font-semibold">User</th>
                  <th className="text-muted-foreground px-6 py-4 text-sm font-semibold">Contact</th>
                  <th className="text-muted-foreground px-6 py-4 text-sm font-semibold">Role</th>
                  <th className="text-muted-foreground px-6 py-4 text-sm font-semibold">Branches</th>
                  <th className="text-muted-foreground px-6 py-4 text-sm font-semibold">Status</th>
                  <th className="text-muted-foreground px-6 py-4 text-sm font-semibold">Created</th>
                  <th className="text-muted-foreground px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {usersQuery.isLoading ? (
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
                    <tr key={user.userId} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold">
                            {getInitials(user.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold">{user.fullName}</p>
                            <p className="text-muted-foreground text-xs">@{user.username}</p>
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
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{user.restaurantName}</p>
                          <p className="text-muted-foreground text-xs">{user.branchNames.join(", ") || "No branches"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            user.isBanned
                              ? "bg-destructive/10 text-destructive"
                              : user.isActive
                                ? "bg-success/70 text-success-foreground"
                                : "bg-warning/70 text-warning-foreground"
                          )}
                        >
                          {getStatusBadge(user)}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-sm">
                        {dayjs(user.createdAt).format("MMM D, YYYY")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <UserCog />
                              Update user
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <ArrowUpAZ />
                              Change role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant={user.isBanned ? "default" : "destructive"}
                              onClick={() => handleBanToggle(user)}
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

          <div className="border-border/60 flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground text-sm">
              Page {pageNumber} of {Math.max(totalPages, 1)}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))}
                disabled={pageNumber >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </section>

      <UserFormDialog
        open={isDialogOpen}
        mode={dialogMode}
        value={formValues}
        errors={formErrors}
        branches={branches ?? []}
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
    </div>
  );
};
