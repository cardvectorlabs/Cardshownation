import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin") || pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!ADMIN_PASSWORD) {
    return new NextResponse("Admin access disabled - set ADMIN_PASSWORD.", { status: 503 });
  }

  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (await verifyAdminSessionToken(cookie?.value, ADMIN_PASSWORD)) {
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
