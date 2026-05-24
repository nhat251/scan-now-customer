class Path {
  home = "/" as const;

  auth = {
    login: "/login" as const,
    logout: "/logout" as const,
  };

  dashboards = {
    admin: "/admin/dashboard" as const,
    owner: "/owner/dashboard" as const,
    manager: "/manager/dashboard" as const,
    staff: "/staff/dashboard" as const,
    kitchen: "/kitchen/dashboard" as const,
  };

  owner = {
    users: "/owner/users" as const,
    restaurant: "/owner/restaurant" as const,
    branches: "/owner/branches" as const,
    get branchDetail() {
      return (id: string) => `${this.branches}/${id}` as const;
    },
    get branchEdit() {
      return (id: string) => `${this.branches}/${id}` as const;
    },
    get branchCreate() {
      return `${this.branches}/create` as const;
    },
    get branchCategories() {
      return (branchId: string) => `${this.branches}/${branchId}/categories` as const;
    },
    get branchCategoryCreate() {
      return (branchId: string) => `${this.branchCategories(branchId)}/create` as const;
    },
    get branchCategoryDetail() {
      return (branchId: string, categoryId: string) => `${this.branchCategories(branchId)}/${categoryId}` as const;
    },
    get branchMenuItems() {
      return (branchId: string) => `${this.branches}/${branchId}/menu-items` as const;
    },
    get branchMenuItemCreate() {
      return (branchId: string) => `${this.branchMenuItems(branchId)}/create` as const;
    },
    menuItems: "/owner/menu-items" as const,
    get menuItemDetail() {
      return (id: string) => `${this.menuItems}/${id}` as const;
    },
    get menuItemPriceHistory() {
      return (id: string) => `${this.menuItems}/${id}/price-history` as const;
    },
    settings: "/owner/settings" as const,
  };

  manager = {
    users: "/manager/users" as const,
    branches: "/manager/branches" as const,
    get branchCategories() {
      return (branchId: string) => `${this.branches}/${branchId}/categories` as const;
    },
    get branchCategoryCreate() {
      return (branchId: string) => `${this.branchCategories(branchId)}/create` as const;
    },
    get branchCategoryDetail() {
      return (branchId: string, categoryId: string) => `${this.branchCategories(branchId)}/${categoryId}` as const;
    },
    get branchMenuItems() {
      return (branchId: string) => `${this.branches}/${branchId}/menu-items` as const;
    },
    get branchMenuItemCreate() {
      return (branchId: string) => `${this.branchMenuItems(branchId)}/create` as const;
    },
    menuItems: "/manager/menu-items" as const,
    get menuItemDetail() {
      return (id: string) => `${this.menuItems}/${id}` as const;
    },
    get menuItemPriceHistory() {
      return (id: string) => `${this.menuItems}/${id}/price-history` as const;
    },
    orders: "/manager/orders" as const,
    inventory: "/manager/inventory" as const,
    settings: "/manager/settings" as const,
  };

  me = {
    branches: "/me/branches" as const,
    get branchDetail() {
      return (id: string) => `${this.branches}/${id}` as const;
    },
    get branchMenu() {
      return (id: string) => `${this.branches}/${id}/menu` as const;
    },
    menuItemDetail: "/me/menu-items" as const,
    get menuItem() {
      return (id: string) => `${this.menuItemDetail}/${id}` as const;
    },
  };

  blogs = {
    root: "/blogs" as const,
    get _id() {
      return (id: string) => `${this.root}/${id}` as const;
    },
  };

  insights = {
    root: "/insights" as const,
    get _slug() {
      return (slug: string) => `${this.root}/${slug}` as const;
    },
  };
}

export const PATH = new Path();
