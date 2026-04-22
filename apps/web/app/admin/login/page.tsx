import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { sanitizeLocalRedirectTarget } from "@/lib/url";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const encoder = new TextEncoder();

async function hashString(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function constantTimeEqual(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([hashString(left), hashString(right)]);
  let difference = 0;

  for (let i = 0; i < leftHash.length; i += 1) {
    difference |= leftHash[i] ^ rightHash[i];
  }

  return difference === 0;
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleLogin(formData: FormData) {
  "use server";
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const from = sanitizeLocalRedirectTarget(formData.get("from"));
  const expected = process.env.ADMIN_PASSWORD;
  const requestHeaders = await headers();
  const ip = getRequestIp(requestHeaders) ?? "unknown";
  const rateLimit = consumeRateLimit("admin-login", ip, {
    blockMs: LOGIN_BLOCK_MS,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    redirect(`/admin/login?error=rate&from=${encodeURIComponent(from)}`);
  }

  if (!expected || !(await constantTimeEqual(password, expected))) {
    await delay(750);
    redirect(`/admin/login?error=1&from=${encodeURIComponent(from)}`);
  }

  resetRateLimit("admin-login", ip);
  const sessionToken = await createAdminSessionToken(expected);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  redirect(from);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const from = sanitizeLocalRedirectTarget(sp.from);
  const errorMessage =
    sp.error === "rate"
      ? "Too many attempts. Wait 30 minutes and try again."
      : sp.error === "1"
        ? "Incorrect password."
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Admin login</h1>
        <p className="mt-1 text-sm text-slate-500">Card Show Nation</p>

        <form action={handleLogin} className="mt-6 space-y-4">
          <input type="hidden" name="from" value={from} />
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
              />
          </div>
          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
