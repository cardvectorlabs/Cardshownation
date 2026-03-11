import Link from "next/link";
import { db } from "@/lib/db";
import { formatShowDate } from "@/lib/utils";

type SearchParams = { status?: string; stale?: string; page?: string };

export default async function AdminShowsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 30;
  const offset = (page - 1) * limit;
  const staleDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const where: any = {};
  if (sp.status) where.status = sp.status;
  if (sp.stale === "1") {
    where.status = "APPROVED";
    where.OR = [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: staleDate } }];
  }

  const [shows, total] = await Promise.all([
    db.show.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, title: true, status: true, city: true, state: true,
        startDate: true, endDate: true, lastVerifiedAt: true, slug: true,
      },
    }),
    db.show.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statusFilters = [
    { label: "All", href: "/admin/shows" },
    { label: "Approved", href: "/admin/shows?status=APPROVED" },
    { label: "Pending", href: "/admin/shows?status=PENDING" },
    { label: "Rejected", href: "/admin/shows?status=REJECTED" },
    { label: "Stale (90d)", href: "/admin/shows?stale=1" },
  ];

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Shows
          <span className="ml-2 text-base font-normal text-slate-400">({total.toLocaleString()})</span>
        </h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusFilters.map((f: any) => {
          const isActive =
            f.href === "/admin/shows"
              ? !sp.status && !sp.stale
              : f.href.includes("stale")
              ? sp.stale === "1"
              : sp.status === new URLSearchParams(f.href.split("?")[1]).get("status");
          return (
            <Link
              key={f.href}
              href={f.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Show</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Verified</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shows.map((show: any) => {
              const isStale = show.status === "APPROVED" &&
                (!show.lastVerifiedAt || show.lastVerifiedAt < staleDate);
              return (
                <tr key={show.id} className={`hover:bg-slate-50 transition-colors ${isStale ? "bg-orange-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 leading-snug">{show.title}</p>
                    <p className="text-xs text-slate-400">{show.city}, {show.state}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {formatShowDate(show.startDate, show.endDate)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {show.lastVerifiedAt ? (
                      <span className="text-xs text-slate-500">
                        {new Date(show.lastVerifiedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-orange-500">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={show.status} stale={isStale} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/shows/${show.slug}`} target="_blank"
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        View ↗
                      </Link>
                      <Link href={`/admin/shows/${show.id}`}
                        className="text-sm text-brand-600 font-medium hover:underline">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shows.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">No shows found.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/shows?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/admin/shows?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, stale }: { status: string; stale: boolean }) {
  if (stale) return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
      Stale
    </span>
  );
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
