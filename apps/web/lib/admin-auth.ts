import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { sanitizeLocalRedirectTarget } from "@/lib/url";

export async function hasValidAdminSession() {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }

  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value, expected);
}

export async function requireAdminSession(from = "/admin") {
  if (await hasValidAdminSession()) {
    return;
  }

  redirect(`/admin/login?from=${encodeURIComponent(sanitizeLocalRedirectTarget(from))}`);
}
