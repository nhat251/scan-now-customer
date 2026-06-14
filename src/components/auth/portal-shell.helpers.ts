export const getPortalInitials = (name?: string | null) => {
  if (!name) {
    return "SN";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};
