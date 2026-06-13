import { type NextRequest, NextResponse } from "next/server";

import { getReservedSubdomainFromHostname } from "@/lib/tenant-slug";

const PLATFORM_BASE_URL = "https://scannow.site";

export function proxy(request: NextRequest) {
  const reservedSubdomain = getReservedSubdomainFromHostname(request.nextUrl.hostname);

  if (!reservedSubdomain) {
    return NextResponse.next();
  }

  return NextResponse.redirect(PLATFORM_BASE_URL);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
