import Link from "next/link";
import { redirect } from "next/navigation";
import { authenticateModerator } from "@/lib/moderators";
import { getModeratorSession, startModeratorSession } from "@/lib/moderator-auth";
import { sanitizeLocalRedirectTarget } from "@/lib/url";

function sanitizeModeratorRedirectTarget(value: unknown) {
  const sanitized = sanitizeLocalRedirectTarget(value, "/moderator");
  return sanitized.startsWith("/moderator/login") ? "/moderator" : sanitized;
}

function readString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

async function handleLogin(formData: FormData) {
  "use server";

  const email = readString(formData, "email", 320).toLowerCase();
  const password = readString(formData, "password", 200);
  const redirectTo = sanitizeModeratorRedirectTarget(formData.get("from"));

  const user = await authenticateModerator(email, password);
  if (!user) {
    redirect(`/moderator/login?error=invalid&from=${encodeURIComponent(redirectTo)}`);
  }

  await startModeratorSession(user.id);
  redirect(redirectTo);
}

export default async function ModeratorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const session = await getModeratorSession();
  if (session) {
    redirect("/moderator");
  }

  const sp = await searchParams;
  const from = sanitizeModeratorRedirectTarget(sp.from);
  const errorMessage =
    sp.error === "invalid" ? "Email or password did not match this moderator account." : null;

  return (
    <div className="container-narrow py-6 sm:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Moderator portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Log in
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Sign in to review submitted shows and flag promoters for admin trust review.
        </p>

        {errorMessage && (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <form action={handleLogin} className="mt-8 space-y-5">
          <input type="hidden" name="from" value={from} />

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/moderator/signup" className="font-semibold text-brand-700 hover:text-brand-800">
            Create moderator account
          </Link>
        </p>
      </div>
    </div>
  );
}

