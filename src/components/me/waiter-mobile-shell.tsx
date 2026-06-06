"use client";

import Link from "next/link";
import { Bell, ClipboardList, Grid2x2, LogOut, Soup, UserCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useLogoutMutation } from "@/hooks/mutations/useLogoutMutation";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

type WaiterMobileShellProps = {
  children: ReactNode;
  title: string;
  branchId: string;
  branchName?: string | null;
  active: "orders" | "tables" | "create" | "menu" | "profile" | "kitchen";
  currentUser?: Pick<AuthUser, "fullName" | "role" | "avatarUrl"> | null;
  actions?: ReactNode;
  stats?: ReactNode;
  navItems?: PortalNavItem[];
};

type MobileNavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
};

const waiterNavItems = (branchId: string) => [
  {
    key: "orders",
    label: "Đơn hàng",
    href: PATH.me.branchOrders(branchId),
    icon: <ClipboardList className="size-5" />,
  },
  {
    key: "tables",
    label: "Sơ đồ bàn",
    href: PATH.me.branchTables(branchId),
    icon: <Grid2x2 className="size-5" />,
  },
  {
    key: "menu",
    label: "Menu",
    href: PATH.me.branchMenu(branchId),
    icon: <Soup className="size-5" />,
  },
  {
    key: "profile",
    label: "Tôi",
    href: PATH.me.branchDetail(branchId),
    icon: <UserCircle2 className="size-5" />,
  },
] satisfies MobileNavItem[];

const getMobileNavItems = (branchId: string, navItems?: PortalNavItem[]): MobileNavItem[] => {
  if (!navItems?.length) {
    return waiterNavItems(branchId);
  }

  const branchScopedPrefix = `${PATH.me.branches}/${branchId}`;

  return navItems
    .filter((item) => item.href === branchScopedPrefix || item.href.startsWith(`${branchScopedPrefix}/`))
    .map((item) => ({
      key: item.href,
      label: item.label,
      href: item.href,
      icon: item.icon,
      active: item.active,
    }));
};

export const WaiterMobileShell = ({
  children,
  title,
  branchId,
  branchName,
  active,
  currentUser,
  actions,
  stats,
  navItems,
}: WaiterMobileShellProps) => {
  const logoutMutation = useLogoutMutation();
  const items = getMobileNavItems(branchId, navItems);
  const isItemActive = (item: MobileNavItem) => item.active ?? item.key === active;

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-sans text-stone-900">
      <aside className="fixed top-0 left-0 hidden h-screen w-64 flex-col border-r border-[#e8e4dc] bg-white lg:flex">
        <div className="px-6 pt-8 pb-6">
          <p className="text-primary-container text-3xl font-black tracking-tight">ScanNow</p>
          <p className="mt-1 text-sm text-stone-500">Khu vực nhân viên</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <Link
              key={`${item.key}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-stone-500 transition-all hover:bg-stone-100",
                isItemActive(item) && "border-primary-container bg-primary-container/10 text-primary-container rounded-r-none border-r-4",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#e8e4dc] p-6">
          <p className="truncate text-sm font-bold">{currentUser?.fullName ?? "ScanNow"}</p>
          <p className="mt-1 truncate text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">
            {currentUser?.role ?? "STAFF"}
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center justify-between border-b border-[#e8e4dc] bg-white px-4 shadow-sm lg:h-16 lg:px-8">
          <div className="min-w-0">
            <p className="text-primary-container text-[18px] font-black tracking-tight lg:hidden">ScanNow</p>
            <p className="hidden text-lg font-black tracking-tight lg:block">{title}</p>
            <p className="truncate text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase">
              {branchName ?? currentUser?.fullName ?? "Nhân viên"}
            </p>
          </div>

          <h1 className="max-w-[150px] truncate text-center text-[16px] font-black lg:hidden">{title}</h1>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">Trực tuyến</span>
            </div>
            <Bell className="size-5 text-stone-500" />
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
              Đăng xuất
            </Button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-0 py-0 lg:px-8 lg:py-8">
          {stats ? (
            <section className="hidden shrink-0 lg:grid lg:grid-cols-4 lg:gap-4">
              <div className="contents [&>*]:p-5">
                {stats}
              </div>
            </section>
          ) : null}

          {actions ? (
            <section className="hidden shrink-0 rounded-2xl border border-[#e8e4dc] bg-white p-4 shadow-sm lg:block">
              {actions}
            </section>
          ) : null}

          <main className="flex-1 space-y-5 px-4 py-4 pb-[92px] lg:space-y-8 lg:p-0">{children}</main>
        </div>

        <nav
          className="fixed bottom-0 left-1/2 z-50 grid h-[68px] w-full max-w-[500px] -translate-x-1/2 items-center border-t border-[#e8e4dc] bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
        >
          {items.map((item) => (
            <WaiterNavItem key={item.key} item={item} active={isItemActive(item)} />
          ))}
        </nav>
      </div>
    </div>
  );
};

const WaiterNavItem = ({
  item,
  active,
}: {
  item: MobileNavItem;
  active: boolean;
}) => {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-w-[68px] flex-col items-center gap-1 py-2 text-[10px] transition-colors",
        active ? "text-primary-container" : "text-stone-400",
      )}
    >
      {item.icon}
      <span className={cn("font-medium", active && "font-bold")}>{item.label}</span>
    </Link>
  );
};
