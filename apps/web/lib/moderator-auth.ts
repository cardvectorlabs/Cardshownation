import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createModeratorSessionToken,
  MODERATOR_COOKIE_NAME,
  MODERATOR_SESSION_MAX_AGE_SECONDS,
  verifyModeratorSessionToken,
} from "@/lib/moderator-session";
import { sanitizeLocalRedirectTarget } from "@/lib/url";

async function getModeratorSessionSecret() {
  const explicit = process.env.MODERATOR_SESSION_SECRET?.trim();
  if (explicit) {
    return explicit;
  }

  const fallback = process.env.PROMOTER_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  return fallback || null;
}

export async function getModeratorSession() {
  const secret = await getModeratorSessionSecret();
  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(MODERATOR_COOKIE_NAME)?.value;
  const payload = await verifyModeratorSessionToken(token, secret);
  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.uid },
  });

  if (!user || user.role !== "MODERATOR") {
    return null;
  }

  return { user };
}

export async function requireModeratorSession(from = "/moderator") {
  const session = await getModeratorSession();
  if (session) {
    return session;
  }

  redirect(
    `/moderator/login?from=${encodeURIComponent(sanitizeLocalRedirectTarget(from, "/moderator"))}`
  );
}

export async function startModeratorSession(userId: string) {
  const secret = await getModeratorSessionSecret();
  if (!secret) {
    throw new Error("Moderator portal is not configured.");
  }

  const token = await createModeratorSessionToken(userId, secret);
  const cookieStore = await cookies();
  cookieStore.set(MODERATOR_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MODERATOR_SESSION_MAX_AGE_SECONDS,
  });
}

export async function endModeratorSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MODERATOR_COOKIE_NAME);
}

