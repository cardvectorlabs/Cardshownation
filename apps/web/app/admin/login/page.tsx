import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function handleLogin(formData: FormData) {
  "use server";
  const password = formData.get("password");
  const from = formData.get("from");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    redirect(`/admin/login?error=1&from=${encodeURIComponent(String(from ?? "/admin"))}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("csn_admin", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect(String(from ?? "/admin"));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const hasError = sp.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Admin login</h1>
        <p className="mt-1 text-sm text-slate-500">Card Show Nation</p>

        <form action={handleLogin} className="mt-6 space-y-4">
          <input type="hidden" name="from" value={sp.from ?? "/admin"} />
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
          {hasError && (
            <p className="text-sm text-red-600">Incorrect password.</p>
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
