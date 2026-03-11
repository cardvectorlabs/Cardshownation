import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminShowStats, getPendingSubmissions } from "@/lib/shows";
import { formatShowDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [stats, pendingSubmissions, recentShows] = await Promise.all([
    getAdminShowStats(),
    getPendingSubmissions(),
    db.show.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, title: true, status: true, city: true,
        state: true, startDate: true, endDate: true, lastVerifiedAt: true, createdAt: true,
      },
    }),
  ]);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/submit-show"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          + Add Show
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Pending Review", value: stats.pending, color: "text-yellow-600", href: "/admin/submissions" },
          { label: "Approved Shows", value: stats.approved, color: "text-green-600", href: "/admin/shows?status=APPROVED" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500", href: "/admin/shows?status=REJECTED" },
          { label: "Stale (90+ days)", value: stats.stale, color: "text-orange-500", href: "/admin/shows?stale=1" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending submissions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending Submissions
              {pendingSubmissions.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  {pendingSubmissions.length}
                </span>
              )}
            </h2>
            <Link href="/admin/submissions" className="text-sm text-brand-600 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
              All caught up!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.slice(0, 5).map((sub: any) => {
                const payload = sub.payloadJson as any;
                return (
                  <div key={sub.id} className="rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {payload.showName ?? "Unnamed Show"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {payload.city}, {payload.state} · by {sub.submitterName}
                      </p>
                    </div>
                    <Link
                      href={`/admin/submissions/${sub.id}`}
                      className="shrink-0 rounded-lg bg-white border border-yellow-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-yellow-100 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent shows */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Shows</h2>
            <Link href="/admin/shows" className="text-sm text-brand-600 hover:underline font-medium">
              Manage all →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Show</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentShows.map((show: any) => (
                  <tr key={show.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/shows/${show.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600 transition-colors block truncate max-w-[180px]">
                        {show.title}
                      </Link>
                      <span className="text-xs text-slate-400">{show.city}, {show.state}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell text-xs">
                      {formatShowDate(show.startDate, show.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={show.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentShows.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No shows yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-50 text-green-700",
    PENDING: "bg-yellow-50 text-yellow-700",
    REJECTED: "bg-red-50 text-red-600",
    EXPIRED: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
