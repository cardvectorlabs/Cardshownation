import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getPromoterSession,
  getPromoterSessionSecret,
  startPromoterSession,
} from "@/lib/promoter-auth";
import { registerPromoterAccount } from "@/lib/promoters";
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

function readOptionalString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleSignup(formData: FormData) {
  "use server";

  const sessionSecret = await getPromoterSessionSecret();
  const contactName = readRequiredString(formData, "contactName", 120);
  const organizerName = readRequiredString(formData, "organizerName", 160);
  const email = readRequiredString(formData, "email", 320).toLowerCase();
  const password = readRequiredString(formData, "password", 200);
  const confirmPassword = readRequiredString(formData, "confirmPassword", 200);
  const websiteUrl = readOptionalString(formData, "websiteUrl", 2048);
  const facebookUrl = readOptionalString(formData, "facebookUrl", 2048);
  const instagramUrl = readOptionalString(formData, "instagramUrl", 2048);
  const requestHeaders = await headers();
  const ip = getRequestIp(requestHeaders) ?? "unknown";
  const rateLimit = consumeRateLimit("promoter-signup", ip, {
    blockMs: SIGNUP_BLOCK_MS,
    maxAttempts: MAX_SIGNUP_ATTEMPTS,
    windowMs: SIGNUP_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    redirect("/promoter/signup?error=rate");
  }

  if (!sessionSecret) {
    redirect("/promoter/signup?error=disabled");
  }

  if (
    !contactName ||
    !organizerName ||
    !email ||
    !password ||
    password.length < 8 ||
    password !== confirmPassword ||
    !isValidEmail(email)
  ) {
    redirect("/promoter/signup?error=validation");
  }

  try {
    const user = await registerPromoterAccount({
      contactName,
      organizerName,
      email,
      password,
      websiteUrl,
      facebookUrl,
      instagramUrl,
    });
    resetRateLimit("promoter-signup", ip);
    await startPromoterSession(user.id);
    redirect("/promoter");
  } catch {
    await delay(750);
    redirect("/promoter/signup?error=exists");
  }
}

export default async function PromoterSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, secret, sp] = await Promise.all([
    getPromoterSession(),
    getPromoterSessionSecret(),
    searchParams,
  ]);
  if (session) {
    redirect("/promoter");
  }

  const errorMessage =
    sp.error === "exists"
      ? "A promoter account already exists for that email."
      : sp.error === "disabled"
        ? "Promoter signup is temporarily unavailable."
      : sp.error === "rate"
        ? "Too many attempts. Wait a bit and try again."
      : sp.error === "validation"
        ? "Check your information. Passwords must match and be at least 8 characters."
        : null;

  return (
    <div className="container-narrow py-6 sm:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Promoter portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Create promoter account
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Save your promoter profile once, then post new shows from your phone without retyping
          your organizer information every time.
        </p>

        {errorMessage && (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <form action={handleSignup} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="contactName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Your name
            </label>
            <input
              id="contactName"
              name="contactName"
              type="text"
              required
              disabled={!secret}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="organizerName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Organizer or business name
            </label>
            <input
              id="organizerName"
              name="organizerName"
              type="text"
              required
              disabled={!secret}
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
              autoComplete="email"
              disabled={!secret}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!secret}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!secret}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          <details className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Add profile links now
            </summary>

            <div className="mt-5 space-y-5">
              <p className="text-sm leading-6 text-slate-600">
                You can enter plain domains here. We will add https:// automatically.
              </p>

              <div>
                <label
                  htmlFor="websiteUrl"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Website
                </label>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  disabled={!secret}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
                  placeholder="example.com or https://example.com"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="facebookUrl"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Facebook
                  </label>
                  <input
                    id="facebookUrl"
                    name="facebookUrl"
                    type="url"
                    disabled={!secret}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
                    placeholder="facebook.com/yourpage or https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label
                    htmlFor="instagramUrl"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Instagram
                  </label>
                  <input
                    id="instagramUrl"
                    name="instagramUrl"
                    type="url"
                    disabled={!secret}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
                    placeholder="instagram.com/yourpage or https://instagram.com/yourpage"
                  />
                </div>
              </div>
            </div>
          </details>

          <button
            type="submit"
            disabled={!secret}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/promoter/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
