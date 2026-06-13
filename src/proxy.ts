import { type NextRequest, NextResponse } from "next/server";

import { getReservedSubdomainFromHostname, getTenantSlugFromHostname } from "@/lib/tenant-slug";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const PLATFORM_BASE_URL = "https://scannow.site";

async function isRegisteredTenant(slug: string) {
  if (!API_BASE_URL) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/public/tenants/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const reservedSubdomain = getReservedSubdomainFromHostname(request.nextUrl.hostname);

  if (reservedSubdomain) {
    return NextResponse.redirect(PLATFORM_BASE_URL);
  }

  const tenantSlug = getTenantSlugFromHostname(request.nextUrl.hostname);

  if (!tenantSlug) {
    return NextResponse.next();
  }

  const tenantExists = await isRegisteredTenant(tenantSlug);

  if (tenantExists) {
    return NextResponse.next();
  }

  return NextResponse.redirect(PLATFORM_BASE_URL);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
