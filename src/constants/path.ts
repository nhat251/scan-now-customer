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
    cashier: "/cashier/dashboard" as const,
  };

  owner = {
    root: "/owner" as const,
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
    get branchTables() {
      return (branchId: string) => `${this.branches}/${branchId}/tables` as const;
    },
    get branchOrders() {
      return (branchId: string) => `${this.branches}/${branchId}/orders` as const;
    },
    get branchTableCreate() {
      return (branchId: string) => `${this.branchTables(branchId)}/create` as const;
    },
    get branchTableDetail() {
      return (branchId: string, tableId: string) => `${this.branchTables(branchId)}/${tableId}` as const;
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
    root: "/manager" as const,
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
    get branchTables() {
      return (branchId: string) => `${this.branches}/${branchId}/tables` as const;
    },
    get branchOrders() {
      return (branchId: string) => `${this.branches}/${branchId}/orders` as const;
    },
    get branchTableCreate() {
      return (branchId: string) => `${this.branchTables(branchId)}/create` as const;
    },
    get branchTableDetail() {
      return (branchId: string, tableId: string) => `${this.branchTables(branchId)}/${tableId}` as const;
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

  staff = {
    root: "/staff" as const,
  };

  kitchen = {
    root: "/kitchen" as const,
  };

  cashier = {
    root: "/cashier" as const,
    dashboard: "/cashier/dashboard" as const,
    orders: "/cashier/orders" as const,
  };

  customer = {
    tablesRoot: "/tables" as const,
    sessionsRoot: "/sessions" as const,
    get table() {
      return (qrCodeToken: string) => `${this.tablesRoot}/${qrCodeToken}` as const;
    },
    get menu() {
      return (sessionCode: string) => `${this.sessionsRoot}/${sessionCode}/menu` as const;
    },
    get checkout() {
      return (sessionCode: string, orderId?: string) =>
        orderId
          ? `${this.sessionsRoot}/${sessionCode}/checkout?orderId=${orderId}` as const
          : `${this.sessionsRoot}/${sessionCode}/checkout` as const;
    },
    get sessionMenu() {
      return (sessionCode: string) => `/sessions/${sessionCode}/menu` as const;
    },
    get sessionCheckout() {
      return (sessionCode: string) => `/sessions/${sessionCode}/checkout` as const;
    },
    get sessionMenuItem() {
      return (sessionCode: string, menuItemId: string) => `/sessions/${sessionCode}/menu-items/${menuItemId}` as const;
    },
    get sessionOrder() {
      return (sessionCode: string, orderId: string) => `/sessions/${sessionCode}/orders/${orderId}` as const;
    },
  };

  payment = {
    root: "/payment" as const,
    return: "/payment/return" as const,
    cancel: "/payment/cancel" as const,
  };

  me = {
    root: "/me" as const,
    branches: "/me/branches" as const,
    get branchDetail() {
      return (id: string) => `${this.branches}/${id}` as const;
    },
    get branchMenu() {
      return (id: string) => `${this.branches}/${id}/menu` as const;
    },
    get branchTables() {
      return (id: string) => `${this.branches}/${id}/tables` as const;
    },
    get branchOrders() {
      return (id: string) => `${this.branches}/${id}/orders` as const;
    },
    get branchKitchen() {
      return (id: string) => `${this.branches}/${id}/kitchen` as const;
    },
    tableDetail: "/me/tables" as const,
    get table() {
      return (id: string) => `${this.tableDetail}/${id}` as const;
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
