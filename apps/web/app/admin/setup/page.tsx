import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, startAdminSession } from "@/lib/admin-auth";
import { hasAnyAdminUsers, registerInitialAdmin } from "@/lib/admins";

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

async function handleSetup(formData: FormData) {
  "use server";

  const bootstrapCode =
    process.env.ADMIN_SETUP_CODE?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
  const name = readRequiredString(formData, "name", 120);
  const email = readRequiredString(formData, "email", 320).toLowerCase();
  const password = readRequiredString(formData, "password", 200);
  const confirmPassword = readRequiredString(formData, "confirmPassword", 200);
  const setupCode = readRequiredString(formData, "setupCode", 200);

  if (
    !bootstrapCode ||
    !name ||
    !email ||
    !isValidEmail(email) ||
    password.length < 8 ||
    password !== confirmPassword ||
    setupCode !== bootstrapCode
  ) {
    redirect("/admin/setup?error=validation");
  }

  try {
    const user = await registerInitialAdmin({ name, email, password });
    await startAdminSession(user.id);
    redirect("/admin");
  } catch {
    redirect("/admin/setup?error=exists");
  }
}

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, adminExists, sp] = await Promise.all([
    getAdminSession(),
    hasAnyAdminUsers(),
    searchParams,
  ]);

  if (session) {
    redirect("/admin");
  }

  if (adminExists) {
    redirect("/admin/login");
  }

  const bootstrapCodeExists = Boolean(
    process.env.ADMIN_SETUP_CODE?.trim() || process.env.ADMIN_PASSWORD?.trim()
  );
  const errorMessage =
    sp.error === "exists"
      ? "An admin account already exists."
      : sp.error === "validation"
        ? "Check your setup code, email, and password fields."
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Create first admin</h1>
        <p className="mt-1 text-sm text-slate-500">Card Show Nation admin bootstrap</p>

        {!bootstrapCodeExists ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Set `ADMIN_SETUP_CODE` or keep `ADMIN_PASSWORD` temporarily so the first admin account can be created.
          </div>
        ) : (
          <form action={handleSetup} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="setupCode" className="mb-1.5 block text-sm font-medium text-slate-700">
                Setup code
              </label>
              <input
                id="setupCode"
                name="setupCode"
                type="password"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <button
              type="submit"
              className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Create admin account
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-slate-600">
          Already set up?{" "}
          <Link href="/admin/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}
