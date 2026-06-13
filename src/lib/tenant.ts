import { getTenantSlugFromHostname, normalizeTenantSlug } from "@/lib/tenant-slug";

/**
 * Extracts the tenant slug from the current browser hostname and sends it to
 * the backend via the X-Tenant-Slug request header.
 *
 * Production:  tenant1.scannow.site  →  "tenant1"
 * Local dev:   localhost:3000       →  falls back to NEXT_PUBLIC_DEV_TENANT_SLUG
 * Reserved:    www / app / api / admin / business / staging / localhost
 *              → returns null (no tenant filter applied)
 */

/**
 * Returns the tenant slug for the current request, or null when there is none.
 * Safe to call on the server (returns null) and on the client.
 */
export function getTenantSlug(): string | null {
  // Server-side: no window, no subdomain to read.
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname; // e.g. "tenant1.scannow.site"
  const tenantSlug = getTenantSlugFromHostname(hostname);
  if (tenantSlug) return tenantSlug;

  // Fallback for local development where there is no real subdomain.
  return normalizeTenantSlug(process.env.NEXT_PUBLIC_DEV_TENANT_SLUG);
}
