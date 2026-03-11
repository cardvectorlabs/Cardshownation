import Link from "next/link";
import { db } from "@/lib/db";

export default async function SubmissionsPage() {
  const submissions = await db.showSubmission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = submissions.filter((s: any) => s.status === "PENDING");
  const reviewed = submissions.filter((s: any) => s.status !== "PENDING");

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">
        Submissions
        {pending.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-1 text-sm font-medium text-yellow-700">
            {pending.length} pending
          </span>
        )}
      </h1>

      <SubmissionTable submissions={pending} title="Pending Review" emptyText="All caught up!" />
      <div className="mt-10">
        <SubmissionTable submissions={reviewed.slice(0, 30)} title="Recently Reviewed" emptyText="No reviewed submissions yet" />
      </div>
    </div>
  );
}

function SubmissionTable({
  submissions,
  title,
  emptyText,
}: {
  submissions: any[];
  title: string;
  emptyText: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-700 mb-4">{title}</h2>
      {submissions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Show</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Submitted</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((sub: any) => {
                const payload = sub.payloadJson as any;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{payload.showName ?? "Unnamed"}</p>
                      <p className="text-xs text-slate-400">{sub.submitterName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {payload.city}, {payload.state}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sub.status === "PENDING" ? "bg-yellow-50 text-yellow-700" :
                        sub.status === "APPROVED" ? "bg-green-50 text-green-700" :
                        "bg-red-50 text-red-600"
                      }`}>
                        {sub.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/submissions/${sub.id}`}
                        className="text-sm text-brand-600 font-medium hover:underline">
                        {sub.status === "PENDING" ? "Review" : "View"}
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
