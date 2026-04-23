import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { updateAdminPassword } from "@/lib/admins";
import { getRecentAuditLogs } from "@/lib/audit-log";
import { listModeratorAccounts, getUserRoleStats, createModeratorAccountByAdmin } from "@/lib/users";

type SearchParams = {
  created?: string;
  password?: string;
  error?: string;
};

export const dynamic = "force-dynamic";

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

async function createModerator(formData: FormData) {
  "use server";

  const session = await requireAdminSession("/admin/users");
  const name = readRequiredString(formData, "name", 120);
  const email = readRequiredString(formData, "email", 320).toLowerCase();
  const password = readRequiredString(formData, "password", 200);
  const confirmPassword = readRequiredString(formData, "confirmPassword", 200);

  if (!name || !isValidEmail(email) || password.length < 8 || password !== confirmPassword) {
    redirect("/admin/users?error=moderator");
  }

  try {
    await createModeratorAccountByAdmin({
      actorId: session.user.id,
      email,
      name,
      password,
    });
    redirect("/admin/users?created=1");
  } catch {
    redirect("/admin/users?error=moderator");
  }
}

async function changeMyPassword(formData: FormData) {
  "use server";

  const session = await requireAdminSession("/admin/users");
  const currentPassword = readRequiredString(formData, "currentPassword", 200);
  const nextPassword = readRequiredString(formData, "nextPassword", 200);
  const confirmPassword = readRequiredString(formData, "confirmPassword", 200);

  if (nextPassword.length < 12 || nextPassword !== confirmPassword) {
    redirect("/admin/users?error=password");
  }

  try {
    await updateAdminPassword({
      userId: session.user.id,
      currentPassword,
      nextPassword,
    });
    redirect("/admin/users?password=1");
  } catch {
    redirect("/admin/users?error=password");
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [session, moderators, stats, auditLogs, sp] = await Promise.all([
    requireAdminSession("/admin/users"),
    listModeratorAccounts(),
    getUserRoleStats(),
    getRecentAuditLogs(12),
    searchParams,
  ]);

  const message =
    sp.created === "1"
      ? "Moderator account created."
      : sp.password === "1"
        ? "Admin password updated."
        : sp.error === "moderator"
          ? "Moderator creation failed. Check the name, email, and password fields."
          : sp.error === "password"
            ? "Password update failed. Check your current password and confirmation."
            : null;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Manage moderator access, rotate your admin password, and review recent sensitive actions.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-5">
        <StatCard label="Fans" value={String(stats.fans)} />
        <StatCard label="Moderators" value={String(stats.moderators)} />
        <StatCard label="Promoters" value={String(stats.promoters)} />
        <StatCard label="Admins" value={String(stats.admins)} />
        <StatCard label="State subscriptions" value={String(stats.subscriptions)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Create moderator</h2>
          <p className="mt-2 text-sm text-slate-500">
            Moderator access is admin-managed only. New moderator accounts can review submissions but cannot grant promoter trust or assign shows.
          </p>

          <form action={createModerator} className="mt-5 space-y-4">
            <input
              name="name"
              type="text"
              placeholder="Moderator name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <input
              name="email"
              type="email"
              placeholder="moderator@example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="password"
                type="password"
                placeholder="Temporary password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Create moderator
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Rotate admin password</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your current admin account is {session.user.email}. Use at least 12 characters for the replacement password.
          </p>

          <form action={changeMyPassword} className="mt-5 space-y-4">
            <input
              name="currentPassword"
              type="password"
              placeholder="Current password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="nextPassword"
                type="password"
                placeholder="New password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Update password
            </button>
          </form>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Moderators</h2>
          </div>
          {moderators.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No moderator accounts yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {moderators.map((moderator) => (
                <div key={moderator.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {moderator.name ?? moderator.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {moderator.email} · {moderator._count.moderatedSubmissions} reviewed submissions
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Recent audit log</h2>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No audit entries yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((entry) => (
                <div key={entry.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.actor?.name ?? entry.actor?.email ?? "System"} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  {entry.targetId && (
                    <p className="mt-1 text-xs text-slate-400">
                      {entry.targetType}: {entry.targetId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
