import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  approveShowSubmission,
  getSubmissionById,
  getOrganizerApprovalForPayload,
  rejectShowSubmission,
  setOrganizerAutoApprovalForPayload,
} from "@/lib/submissions";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function readReviewEvery(formData: FormData) {
  const reviewEveryValue = formData.get("reviewEvery");
  return Math.max(
    1,
    Math.min(
      10,
      typeof reviewEveryValue === "string"
        ? Number.parseInt(reviewEveryValue, 10) || 4
        : 4
    )
  );
}

async function approveSubmission(submissionId: string, formData: FormData) {
  "use server";
  await requireAdminSession(`/admin/submissions/${submissionId}`);
  const grantAutoApproval = formData.get("grantAutoApproval") === "on";
  const submission = await getSubmissionById(submissionId);
  if (!submission) return;

  if (grantAutoApproval) {
    await setOrganizerAutoApprovalForPayload(
      submission.payloadJson as Record<string, unknown>,
      true,
      readReviewEvery(formData)
    );
  }

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
  const hasOrganizerApprovalContext =
    typeof payload.organizerId === "string" &&
    typeof payload.city === "string" &&
    typeof payload.state === "string";
  const approval =
    hasOrganizerApprovalContext
      ? await getOrganizerApprovalForPayload(payload)
      : null;
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
  const reviewer = "reviewer" in submission ? submission.reviewer : null;

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

      {reviewer && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Reviewed by {reviewer.name ?? reviewer.email} ({reviewer.role.toLowerCase()})
          {submission.notes ? ` · ${submission.notes}` : ""}
        </div>
      )}

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

      {hasOrganizerApprovalContext && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold text-slate-700">Promoter Trust For This Market</h2>
          <p className="mt-2 text-sm text-slate-600">
            {approval?.autoApprove
              ? `${String(payload.city)}, ${String(payload.state)} is already trusted. ${approval.approvedShowCount} approved shows so far, with a spot check every ${approval.reviewEvery}.`
              : `${String(payload.city)}, ${String(payload.state)} is not trusted yet. Approving this show can also enable auto-approval for future submissions in this market.`}
          </p>
        </div>
      )}

      {isPending ? (
        <div className="space-y-4">
          <form action={approveWithId}>
            {hasOrganizerApprovalContext && !approval?.autoApprove && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="grantAutoApproval"
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    Trust this promoter for future shows in {String(payload.city)},{" "}
                    {String(payload.state)}.
                  </span>
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <label
                    htmlFor="reviewEvery"
                    className="text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Spot check every
                  </label>
                  <input
                    id="reviewEvery"
                    name="reviewEvery"
                    type="number"
                    min={1}
                    max={10}
                    defaultValue={4}
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <span className="text-sm text-slate-500">approved shows</span>
                </div>
              </div>
            )}
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
