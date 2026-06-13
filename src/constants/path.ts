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
    settings: "/owner/settings" as const,
  };

  manager = {
    root: "/manager" as const,
    users: "/manager/users" as const,
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
  };

  payment = {
    root: "/payment" as const,
    return: "/payment/return" as const,
    cancel: "/payment/cancel" as const,
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
