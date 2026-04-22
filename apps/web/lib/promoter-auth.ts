import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createPromoterSessionToken,
  PROMOTER_COOKIE_NAME,
  PROMOTER_SESSION_MAX_AGE_SECONDS,
  verifyPromoterSessionToken,
} from "@/lib/promoter-session";
import { sanitizeLocalRedirectTarget } from "@/lib/url";

export async function getPromoterSessionSecret() {
  const explicit = process.env.PROMOTER_SESSION_SECRET?.trim();
  if (explicit) {
    return explicit;
  }

  const fallback = process.env.ADMIN_PASSWORD?.trim();
  return fallback || null;
}

export async function getPromoterSession() {
  const secret = await getPromoterSessionSecret();
  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(PROMOTER_COOKIE_NAME)?.value;
  const payload = await verifyPromoterSessionToken(token, secret);

  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.uid },
    include: {
      organizer: {
        include: {
          approvals: {
            orderBy: [{ state: "asc" }, { city: "asc" }],
          },
        },
      },
    },
  });

  if (!user?.organizer || user.role !== "ORGANIZER") {
    return null;
  }

  return {
    user,
    organizer: user.organizer,
  };
}

export async function requirePromoterSession(from = "/promoter") {
  const session = await getPromoterSession();
  if (session) {
    return session;
  }

  redirect(
    `/promoter/login?from=${encodeURIComponent(sanitizeLocalRedirectTarget(from, "/promoter"))}`
  );
}

export async function startPromoterSession(userId: string) {
  const secret = await getPromoterSessionSecret();
  if (!secret) {
    throw new Error("Promoter portal is not configured.");
  }

  const token = await createPromoterSessionToken(userId, secret);
  const cookieStore = await cookies();
  cookieStore.set(PROMOTER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PROMOTER_SESSION_MAX_AGE_SECONDS,
  });
}

export async function endPromoterSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PROMOTER_COOKIE_NAME);
}
