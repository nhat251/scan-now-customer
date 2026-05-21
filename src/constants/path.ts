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
