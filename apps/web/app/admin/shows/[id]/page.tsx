import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatShowDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

// Server actions for approve/reject/mark-verified
async function approveShow(showId: string) {
  "use server";
  await db.show.update({
    where: { id: showId },
    data: { status: "APPROVED", lastVerifiedAt: new Date() },
  });
  redirect("/admin/shows");
}

async function rejectShow(showId: string) {
  "use server";
  await db.show.update({
    where: { id: showId },
    data: { status: "REJECTED" },
  });
  redirect("/admin/shows");
}

async function markVerified(showId: string) {
  "use server";
  await db.show.update({
    where: { id: showId },
    data: { lastVerifiedAt: new Date() },
  });
  redirect(`/admin/shows/${showId}`);
}

export default async function AdminShowDetailPage({ params }: Props) {
  const { id } = await params;
  const show = await db.show.findUnique({
    where: { id },
    include: { venue: true, organizer: true },
  });

  if (!show) notFound();

  const approveShowWithId = approveShow.bind(null, show.id);
  const rejectShowWithId = rejectShow.bind(null, show.id);
  const markVerifiedWithId = markVerified.bind(null, show.id);

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/shows" className="text-sm text-brand-600 hover:underline">
          ← Back to Shows
        </Link>
        <Link href={`/shows/${show.slug}`} target="_blank"
          className="text-sm text-slate-400 hover:text-slate-600">
          View live ↗
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{show.title}</h1>
          <p className="text-slate-500 mt-1">{show.city}, {show.state} · {formatShowDate(show.startDate, show.endDate)}</p>
        </div>
        <StatusBadge status={show.status} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white rounded-xl border border-slate-200">
        {show.status !== "APPROVED" && (
          <form action={approveShowWithId}>
            <button type="submit"
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
              ✓ Approve
            </button>
          </form>
        )}
        {show.status !== "REJECTED" && (
          <form action={rejectShowWithId}>
            <button type="submit"
              className="rounded-lg bg-red-50 border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors">
              ✕ Reject
            </button>
          </form>
        )}
        <form action={markVerifiedWithId}>
          <button type="submit"
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Mark Verified Today
          </button>
        </form>
        <p className="text-xs text-slate-400 self-center">
          Last verified: {show.lastVerifiedAt
            ? new Date(show.lastVerifiedAt).toLocaleDateString()
            : "Never"}
        </p>
      </div>

      {/* Show details */}
      <div className="space-y-6">
        <Section title="Show Details">
          <Field label="Title" value={show.title} />
          <Field label="Slug" value={show.slug} mono />
          <Field label="Status" value={show.status} />
          <Field label="Source" value={show.sourceType} />
          <Field label="Categories" value={show.categories.join(", ") || "—"} />
          <Field label="Start Date" value={show.startDate.toLocaleString()} />
          <Field label="End Date" value={show.endDate.toLocaleString()} />
          <Field label="Time" value={`${show.startTimeLabel ?? "—"} – ${show.endTimeLabel ?? "—"}`} />
          <Field label="Free" value={show.isFree ? "Yes" : "No"} />
          <Field label="Admission" value={show.admissionPrice ?? "—"} />
          <Field label="Table Count" value={show.tableCount?.toString() ?? "—"} />
          {show.description && <Field label="Description" value={show.description} />}
        </Section>

        <Section title="Location">
          <Field label="City" value={show.city} />
          <Field label="State" value={show.state} />
          {show.venue && (
            <>
              <Field label="Venue" value={show.venue.name} />
              <Field label="Address" value={show.venue.address1} />
              {show.venue.postalCode && <Field label="Postal Code" value={show.venue.postalCode} />}
            </>
          )}
          {show.parkingInfo && <Field label="Parking" value={show.parkingInfo} />}
        </Section>

        {show.organizer && (
          <Section title="Organizer">
            <Field label="Name" value={show.organizer.name} />
            {show.organizer.email && <Field label="Email" value={show.organizer.email} />}
            {show.organizer.websiteUrl && <Field label="Website" value={show.organizer.websiteUrl} />}
          </Section>
        )}

        <Section title="Links">
          <Field label="Website" value={show.websiteUrl ?? "—"} />
          <Field label="Facebook" value={show.facebookUrl ?? "—"} />
          <Field label="Tickets" value={show.ticketUrl ?? "—"} />
        </Section>

        <Section title="Meta">
          <Field label="Created" value={show.createdAt.toLocaleString()} />
          <Field label="Updated" value={show.updatedAt.toLocaleString()} />
          <Field label="Expires" value={show.expiresAt?.toLocaleString() ?? "—"} />
          <Field label="ID" value={show.id} mono />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <span className="text-xs font-medium text-slate-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-900 break-words ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-50 text-green-700 border-green-100",
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-100",
    REJECTED: "bg-red-50 text-red-600 border-red-100",
    EXPIRED: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
