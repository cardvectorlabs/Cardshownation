import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_NAME = "csn_admin";
const LOGIN_PATH = "/admin/login";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (but not the login page itself)
  if (!pathname.startsWith("/admin") || pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  // If no password is configured, block access entirely
  if (!ADMIN_PASSWORD) {
    return new NextResponse("Admin access disabled — set ADMIN_PASSWORD.", { status: 503 });
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value === ADMIN_PASSWORD) {
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
