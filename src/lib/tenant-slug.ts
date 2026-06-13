const RESERVED_TENANT_SUBDOMAINS = new Set(["www", "app", "api", "admin", "business", "staging", "localhost"]);

function getSubdomainFromHostname(hostname: string): string | null {
  const cleanHostname = hostname.split(":")[0]?.toLowerCase();

  if (!cleanHostname) {
    return null;
  }

  const parts = cleanHostname.split(".");
  return parts.length >= 3 ? parts[0] : null;
}

export function normalizeTenantSlug(slug?: string | null): string | null {
  const normalized = slug?.trim().toLowerCase();

  if (!normalized || RESERVED_TENANT_SUBDOMAINS.has(normalized)) {
    return null;
  }

  return normalized;
}

export function getTenantSlugFromHostname(hostname: string): string | null {
  return normalizeTenantSlug(getSubdomainFromHostname(hostname));
}

export function getReservedSubdomainFromHostname(hostname: string): string | null {
  const subdomain = getSubdomainFromHostname(hostname);

  if (!subdomain || !RESERVED_TENANT_SUBDOMAINS.has(subdomain)) {
    return null;
  }

  return subdomain;
}
