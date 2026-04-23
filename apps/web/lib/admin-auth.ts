import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { sanitizeLocalRedirectTarget } from "@/lib/url";

async function getAdminSessionSecret() {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) {
    return explicit;
  }

  const fallback =
    process.env.MODERATOR_SESSION_SECRET?.trim() ||
    process.env.PROMOTER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();

  return fallback || null;
}

export async function getAdminSession() {
  const secret = await getAdminSessionSecret();
  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await verifyAdminSessionToken(token, secret);
  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.uid },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return { user };
}

export async function hasValidAdminSession() {
  return Boolean(await getAdminSession());
}

export async function requireAdminSession(from = "/admin") {
  const session = await getAdminSession();
  if (session) {
    return session;
  }

  redirect(`/admin/login?from=${encodeURIComponent(sanitizeLocalRedirectTarget(from))}`);
}

export async function startAdminSession(userId: string) {
  const secret = await getAdminSessionSecret();
  if (!secret) {
    throw new Error("Admin auth is not configured.");
  }

  const token = await createAdminSessionToken(userId, secret);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function endAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
