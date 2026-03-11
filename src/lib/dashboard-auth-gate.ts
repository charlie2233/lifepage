import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasDashboardSession(req: NextRequest) {
  return (
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token")
  );
}

export function handleDashboardAuthGate(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard") && !hasDashboardSession(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
