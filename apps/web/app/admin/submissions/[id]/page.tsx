import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  approveShowSubmission,
  getSubmissionById,
  rejectShowSubmission,
} from "@/lib/submissions";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

async function approveSubmission(submissionId: string) {
  "use server";
  await requireAdminSession(`/admin/submissions/${submissionId}`);
  const show = await approveShowSubmission(submissionId);
  if (!show) return;
  redirect(`/admin/shows/${show.id}`);
}

async function rejectSubmission(submissionId: string, formData: FormData) {
  "use server";
  await requireAdminSession(`/admin/submissions/${submissionId}`);
  const notesValue = formData.get("notes");
  const notes = typeof notesValue === "string" ? notesValue.trim() || null : null;
  await rejectShowSubmission(submissionId, notes);
  redirect("/admin/submissions");
}

export default async function ReviewSubmissionPage({ params }: Props) {
  const { id } = await params;
  await requireAdminSession(`/admin/submissions/${id}`);
  const submission = await getSubmissionById(id);
  if (!submission) notFound();

  const payload = submission.payloadJson as Record<string, unknown>;
  const isPending = submission.status === "PENDING";
  const approveWithId = approveSubmission.bind(null, submission.id);
  const rejectWithId = rejectSubmission.bind(null, submission.id);
  const submittedFields: [string, unknown][] = [
    ["Show Name", payload.showName],
    ["Start Date", payload.startDate],
    ["End Date", payload.endDate],
    ["Start Time", payload.startTimeLabel],
    ["End Time", payload.endTimeLabel],
    ["City", payload.city],
    ["State", payload.state],
    ["Venue Name", payload.venueName],
    ["Venue Address", payload.venueAddress],
    [
      "Categories",
      Array.isArray(payload.categories)
        ? payload.categories.join(", ")
        : payload.categories,
    ],
    ["Organizer Name", payload.organizerName],
    ["Organizer Email", payload.organizerEmail],
    ["Description", payload.description],
    ["Table Count", payload.tableCount],
    ["Vendor Details", payload.vendorDetails],
    ["Website", payload.websiteUrl],
    ["Facebook", payload.facebookUrl],
    [
      "Admission",
      payload.isFree
        ? "Free"
        : `Paid - ${String(payload.admissionPrice ?? "no price given")}`,
    ],
    ["Admission Notes", payload.admissionNotes],
    ["Parking", payload.parkingInfo],
  ];

  return (
    <div className="max-w-3xl p-6 lg:p-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/submissions" className="text-sm text-brand-600 hover:underline">
          ← Back to Submissions
        </Link>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            submission.status === "PENDING"
              ? "bg-yellow-50 text-yellow-700"
              : submission.status === "APPROVED"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
          }`}
        >
          {submission.status}
        </span>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        {typeof payload.showName === "string" ? payload.showName : "Unnamed Show"}
      </h1>
      <p className="mb-8 text-slate-500">
        Submitted by {submission.submitterName} ({submission.submitterEmail}) on{" "}
        {new Date(submission.createdAt).toLocaleDateString()}
      </p>

      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Submitted Details</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {submittedFields
            .filter(([, value]) => value !== null && value !== undefined && value !== "")
            .map(([label, value]) => (
              <div key={String(label)} className="flex gap-4 px-5 py-3">
                <span className="w-36 shrink-0 pt-0.5 text-xs font-medium text-slate-400">
                  {label}
                </span>
                <span className="break-words text-sm text-slate-900">
                  {String(value)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-4">
          <form action={approveWithId}>
            <button
              type="submit"
              className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Approve and Publish Show
            </button>
          </form>

          <form action={rejectWithId} className="space-y-3">
            <textarea
              name="notes"
              rows={3}
              placeholder="Optional: reason for rejection..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              Reject Submission
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">
            This submission has already been{" "}
            <strong>{submission.status.toLowerCase()}</strong>.
            {submission.notes && <> Reason: {submission.notes}</>}
          </p>
          {submission.reviewedShowId && (
            <Link
              href={`/admin/shows/${submission.reviewedShowId}`}
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              View approved show →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
