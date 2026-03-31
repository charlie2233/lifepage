import type { NextRequest } from "next/server";

import { handleDashboardAuthGate } from "@/lib/dashboard-auth-gate";

export function middleware(req: NextRequest) {
  return handleDashboardAuthGate(req);
}

export const config = {
  matcher: ["/:path*"],
};
