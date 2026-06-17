import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { validateSessionSecret } from "@/lib/session-secret";

const LOGIN_PATH = "/admin/login";
const SETUP_PATH = "/admin/setup";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    !pathname.startsWith("/admin") ||
    pathname === LOGIN_PATH ||
    pathname === SETUP_PATH
  ) {
    return NextResponse.next();
  }

  const adminSessionSecret = validateSessionSecret(process.env.ADMIN_SESSION_SECRET, 32).secret;
  if (!adminSessionSecret) {
    return new NextResponse("Admin access disabled - set a strong ADMIN_SESSION_SECRET.", {
      status: 503,
    });
  }

  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (await verifyAdminSessionToken(cookie?.value, adminSessionSecret)) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
