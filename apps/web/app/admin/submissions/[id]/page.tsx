import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

async function approveSubmission(submissionId: string, formData: FormData) {
  "use server";

  const sub = await db.showSubmission.findUnique({ where: { id: submissionId } });
  if (!sub) return;

  const payload = sub.payloadJson as any;

  // Build slug — ensure uniqueness by appending ID suffix if needed
  const baseSlug = slugify(
    `${payload.showName ?? "show"}-${payload.city ?? ""}-${payload.state ?? ""}`
  );

  const existing = await db.show.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? `${baseSlug}-${submissionId.slice(-6)}` : baseSlug;

  // Create the show
  const show = await db.show.create({
    data: {
      title: payload.showName ?? "Untitled Show",
      slug,
      city: payload.city ?? "",
      state: payload.state ?? "",
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate ?? payload.startDate),
      categories: Array.isArray(payload.categories) ? payload.categories : [],
      description: payload.description ?? null,
      tableCount: payload.tableCount ? parseInt(payload.tableCount) : null,
      websiteUrl: payload.websiteUrl ?? null,
      facebookUrl: payload.facebookUrl ?? null,
      isFree: payload.isFree === true,
      admissionPrice: payload.admissionPrice ?? null,
      parkingInfo: payload.parkingInfo ?? null,
      status: "APPROVED",
      sourceType: "SUBMITTED",
      lastVerifiedAt: new Date(),
    },
  });

  // Mark submission approved
  await db.showSubmission.update({
    where: { id: submissionId },
    data: { status: "APPROVED", reviewedShowId: show.id },
  });

  redirect(`/admin/shows/${show.id}`);
}

async function rejectSubmission(submissionId: string, formData: FormData) {
  "use server";
  const notes = formData.get("notes") as string | null;
  await db.showSubmission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", notes: notes ?? null },
  });
  redirect("/admin/submissions");
}

export default async function ReviewSubmissionPage({ params }: Props) {
  const { id } = await params;
  const sub = await db.showSubmission.findUnique({ where: { id } });
  if (!sub) notFound();

  const payload = sub.payloadJson as any;
  const isPending = sub.status === "PENDING";

  const approveWithId = approveSubmission.bind(null, sub.id);
  const rejectWithId = rejectSubmission.bind(null, sub.id);

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/submissions" className="text-sm text-brand-600 hover:underline">
          ← Back to Submissions
        </Link>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          sub.status === "PENDING" ? "bg-yellow-50 text-yellow-700" :
          sub.status === "APPROVED" ? "bg-green-50 text-green-700" :
          "bg-red-50 text-red-600"
        }`}>
          {sub.status}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {payload.showName ?? "Unnamed Show"}
      </h1>
      <p className="text-slate-500 mb-8">
        Submitted by {sub.submitterName} ({sub.submitterEmail}) on{" "}
        {new Date(sub.createdAt).toLocaleDateString()}
      </p>

      {/* Submission data */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Submitted Details</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            ["Show Name", payload.showName],
            ["Start Date", payload.startDate],
            ["End Date", payload.endDate],
            ["City", payload.city],
            ["State", payload.state],
            ["Venue Name", payload.venueName],
            ["Venue Address", payload.venueAddress],
            ["Categories", Array.isArray(payload.categories) ? payload.categories.join(", ") : payload.categories],
            ["Organizer Name", payload.organizerName],
            ["Organizer Email", payload.organizerEmail],
            ["Description", payload.description],
            ["Table Count", payload.tableCount],
            ["Website", payload.websiteUrl],
            ["Facebook", payload.facebookUrl],
            ["Admission", payload.isFree ? "Free" : `Paid — ${payload.admissionPrice ?? "no price given"}`],
            ["Parking", payload.parkingInfo],
          ]
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([label, value]) => (
              <div key={String(label)} className="flex gap-4 px-5 py-3">
                <span className="text-xs font-medium text-slate-400 w-36 shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-slate-900 break-words">{String(value)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      {isPending ? (
        <div className="space-y-4">
          <form action={approveWithId}>
            <button type="submit"
              className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
              ✓ Approve & Publish Show
            </button>
          </form>

          <form action={rejectWithId} className="space-y-3">
            <textarea
              name="notes"
              rows={3}
              placeholder="Optional: reason for rejection..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <button type="submit"
              className="w-full rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors">
              ✕ Reject Submission
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">
            This submission has already been <strong>{sub.status.toLowerCase()}</strong>.
            {sub.notes && <> Reason: {sub.notes}</>}
          </p>
          {sub.reviewedShowId && (
            <Link href={`/admin/shows/${sub.reviewedShowId}`}
              className="mt-3 inline-block text-sm text-brand-600 hover:underline font-medium">
              View approved show →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
