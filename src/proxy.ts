import type { NextRequest } from "next/server";

import { handleDashboardAuthGate } from "@/lib/dashboard-auth-gate";

export function proxy(req: NextRequest) {
  return handleDashboardAuthGate(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
