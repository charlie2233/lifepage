import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getPrimaryAppHostname,
  getRequestHostname,
} from "@/lib/custom-domain";

const SAFE_REDIRECT_METHODS = new Set(["GET", "HEAD"]);

function hasDashboardSession(req: NextRequest) {
  return (
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token")
  );
}

function getCanonicalHostRedirect(req: NextRequest) {
  if (!SAFE_REDIRECT_METHODS.has(req.method)) {
    return null;
  }

  const primaryHost = getPrimaryAppHostname();
  if (!primaryHost || primaryHost.startsWith("www.")) {
    return null;
  }

  const requestHost = getRequestHostname(req.headers.get("host"));
  if (requestHost !== `www.${primaryHost}`) {
    return null;
  }

  const target = req.nextUrl.clone();
  target.protocol = "https:";
  target.host = primaryHost;

  return NextResponse.redirect(target, 308);
}

export function handleDashboardAuthGate(req: NextRequest) {
  const canonicalHostRedirect = getCanonicalHostRedirect(req);
  if (canonicalHostRedirect) {
    return canonicalHostRedirect;
  }

  if (req.nextUrl.pathname.startsWith("/dashboard") && !hasDashboardSession(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
