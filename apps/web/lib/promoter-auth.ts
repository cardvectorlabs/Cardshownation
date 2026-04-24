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

export const MIN_PROMOTER_SESSION_SECRET_LENGTH = 32;

export function validatePromoterSessionSecret(secret: string | null | undefined) {
  const normalized = secret?.trim() || null;
  if (!normalized) {
    return { secret: null, error: "missing" as const };
  }
  if (normalized.length < MIN_PROMOTER_SESSION_SECRET_LENGTH) {
    return { secret: null, error: "too_short" as const };
  }
  return { secret: normalized, error: null };
}

export async function getPromoterSessionSecret() {
  return validatePromoterSessionSecret(process.env.PROMOTER_SESSION_SECRET).secret;
}

export async function getPromoterSessionSecretStatus() {
  return validatePromoterSessionSecret(process.env.PROMOTER_SESSION_SECRET);
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
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PROMOTER_SESSION_MAX_AGE_SECONDS,
  });
}

export async function endPromoterSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PROMOTER_COOKIE_NAME);
}
