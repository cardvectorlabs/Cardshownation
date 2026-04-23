import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getModeratorSession,
  getModeratorSessionSecret,
  startModeratorSession,
} from "@/lib/moderator-auth";
import { registerModeratorAccount } from "@/lib/moderators";
import { getRequestIp } from "@/lib/request-ip";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";

const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
const SIGNUP_BLOCK_MS = 2 * 60 * 60 * 1000;
const MAX_SIGNUP_ATTEMPTS = 5;

function readRequiredString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return "";
  }

  return trimmed;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleSignup(formData: FormData) {
  "use server";

  const moderatorSignupCode = process.env.MODERATOR_SIGNUP_CODE?.trim() || "";
  const sessionSecret = await getModeratorSessionSecret();
  const name = readRequiredString(formData, "name", 120);
  const email = readRequiredString(formData, "email", 320).toLowerCase();
  const password = readRequiredString(formData, "password", 200);
  const confirmPassword = readRequiredString(formData, "confirmPassword", 200);
  const signupCode = readRequiredString(formData, "signupCode", 200);
  const requestHeaders = await headers();
  const ip = getRequestIp(requestHeaders) ?? "unknown";
  const rateLimit = consumeRateLimit("moderator-signup", ip, {
    blockMs: SIGNUP_BLOCK_MS,
    maxAttempts: MAX_SIGNUP_ATTEMPTS,
    windowMs: SIGNUP_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    redirect("/moderator/signup?error=rate");
  }

  if (!moderatorSignupCode) {
    redirect("/moderator/signup?error=disabled");
  }

  if (!sessionSecret) {
    redirect("/moderator/signup?error=secret");
  }

  if (
    !name ||
    !email ||
    !isValidEmail(email) ||
    password.length < 8 ||
    password !== confirmPassword
  ) {
    redirect("/moderator/signup?error=validation");
  }

  if (signupCode !== moderatorSignupCode) {
    await delay(750);
    redirect("/moderator/signup?error=code");
  }

  try {
    const user = await registerModeratorAccount({ name, email, password });
    resetRateLimit("moderator-signup", ip);
    await startModeratorSession(user.id);
    redirect("/moderator");
  } catch {
    await delay(750);
    redirect("/moderator/signup?error=exists");
  }
}

export default async function ModeratorSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, secret, sp] = await Promise.all([
    getModeratorSession(),
    getModeratorSessionSecret(),
    searchParams,
  ]);
  if (session) {
    redirect("/moderator");
  }

  const signupEnabled = Boolean(process.env.MODERATOR_SIGNUP_CODE?.trim());
  const errorMessage =
    sp.error === "exists"
      ? "An account already exists for that email."
      : sp.error === "secret"
        ? "Moderator signup is disabled until MODERATOR_SESSION_SECRET is set on the server."
      : sp.error === "disabled"
        ? "Moderator signup is disabled until MODERATOR_SIGNUP_CODE is set on the server."
        : sp.error === "code"
          ? "Signup code did not match the server value."
          : sp.error === "rate"
            ? "Too many attempts. Wait a bit and try again."
      : sp.error === "validation"
        ? "Check your information. Passwords must match and be at least 8 characters."
        : null;

  return (
    <div className="container-narrow py-6 sm:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Moderator portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Create moderator account
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Create a moderator login so you can review new show submissions and escalate promoter trust recommendations to admin.
        </p>

        {!signupEnabled && (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Moderator signup is currently locked. Set `MODERATOR_SIGNUP_CODE` to issue invite-only accounts.
          </p>
        )}

        {!secret && (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Set `MODERATOR_SESSION_SECRET` before creating moderator accounts.
          </p>
        )}

        {errorMessage && (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <form action={handleSignup} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              disabled={!signupEnabled || !secret}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={!signupEnabled || !secret}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                disabled={!signupEnabled || !secret}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                disabled={!signupEnabled || !secret}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signupCode" className="mb-2 block text-sm font-medium text-slate-700">
              Moderator invite code
            </label>
            <input
              id="signupCode"
              name="signupCode"
              type="password"
              required
              disabled={!signupEnabled || !secret}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!signupEnabled || !secret}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/moderator/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
