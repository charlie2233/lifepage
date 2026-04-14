import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getRequestHostname,
  shouldRedirectToPrimaryAppHostname,
} from "@/lib/custom-domain";
import { getSiteUrl } from "@/lib/site";

function hasDashboardSession(req: NextRequest) {
  return (
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token")
  );
}

function getCanonicalHostRedirect(req: NextRequest) {
  if (!["GET", "HEAD"].includes(req.method)) {
    return null;
  }

  if (req.nextUrl.pathname.startsWith("/api")) {
    return null;
  }

  const hostname = getRequestHostname(req.headers.get("host"));
  if (!hostname || !shouldRedirectToPrimaryAppHostname(hostname)) {
    return null;
  }

  const target = new URL(
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
    getSiteUrl()
  );

  if (getRequestHostname(target.host) === hostname) {
    return null;
  }

  return NextResponse.redirect(target, 308);
}

export function handleDashboardAuthGate(req: NextRequest) {
  const canonicalRedirect = getCanonicalHostRedirect(req);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  if (req.nextUrl.pathname.startsWith("/dashboard") && !hasDashboardSession(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
