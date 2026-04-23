import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutModerator } from "@/app/moderator/actions";
import { getModeratorSession } from "@/lib/moderator-auth";
import { getModeratorDashboardData } from "@/lib/moderators";

export const dynamic = "force-dynamic";

export default async function ModeratorDashboardPage() {
  const session = await getModeratorSession();
  if (!session) {
    redirect("/moderator/login");
  }

  const dashboard = await getModeratorDashboardData(session.user.id);
  if (!dashboard) {
    redirect("/moderator/login");
  }

  return (
    <div className="container-wide py-6 sm:py-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Moderator portal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {dashboard.user.name ?? dashboard.user.email}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Review incoming show submissions, approve clean listings quickly, and flag promoters
              that may be ready for trusted-market approval by admin.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/moderator/submissions"
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Open queue
            </Link>
            <form action={logoutModerator}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Pending submissions" value={String(dashboard.pendingCount)} />
          <StatCard label="Reviewed by you" value={String(dashboard.reviewedCount)} />
          <StatCard label="Role" value="Moderator" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

