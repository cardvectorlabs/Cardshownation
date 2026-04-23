import Link from "next/link";
import { requireModeratorSession } from "@/lib/moderator-auth";
import { getAllSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function ModeratorSubmissionsPage() {
  await requireModeratorSession("/moderator/submissions");

  const submissions = await getAllSubmissions();
  const pending = submissions.filter((submission) => submission.status === "PENDING");
  const reviewed = submissions.filter((submission) => submission.status !== "PENDING");

  return (
    <div className="p-6 lg:p-10">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">
        Review queue
        {pending.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-1 text-sm font-medium text-yellow-700">
            {pending.length} pending
          </span>
        )}
      </h1>

      <SubmissionTable rows={pending} title="Pending Review" emptyText="All caught up." />

      <div className="mt-10">
        <SubmissionTable
          rows={reviewed.slice(0, 30)}
          title="Recently Reviewed"
          emptyText="No reviewed submissions yet."
        />
      </div>
    </div>
  );
}

function SubmissionTable({
  rows,
  title,
  emptyText,
}: {
  rows: any[];
  title: string;
  emptyText: string;
}) {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-slate-700">{title}</h2>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Show
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                  Location
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                  Submitted
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((submission) => {
                const payload = submission.payloadJson as Record<string, unknown>;

                return (
                  <tr key={submission.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {typeof payload.showName === "string" ? payload.showName : "Unnamed"}
                      </p>
                      <p className="text-xs text-slate-400">{submission.submitterName}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {String(payload.city ?? "")}, {String(payload.state ?? "")}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 md:table-cell">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          submission.status === "PENDING"
                            ? "bg-yellow-50 text-yellow-700"
                            : submission.status === "APPROVED"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                        }`}
                      >
                        {submission.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/moderator/submissions/${submission.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        {submission.status === "PENDING" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

