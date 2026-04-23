import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getAdminPromoterById } from "@/lib/promoters";
import { formatShowDate } from "@/lib/utils";

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

async function toggleVerified(organizerId: string, nextValue: boolean) {
  "use server";
  await requireAdminSession(`/admin/promoters/${organizerId}`);
  await db.organizer.update({
    where: { id: organizerId },
    data: { verified: nextValue },
  });
  redirect(`/admin/promoters/${organizerId}`);
}

async function createTrustedCity(organizerId: string, formData: FormData) {
  "use server";
  await requireAdminSession(`/admin/promoters/${organizerId}`);

  const cityValue = formData.get("city");
  const stateValue = formData.get("state");
  const city = typeof cityValue === "string" ? cityValue.trim() : "";
  const state = typeof stateValue === "string" ? stateValue.trim().toUpperCase() : "";
  const reviewEvery = readReviewEvery(formData);

  if (!city || state.length !== 2) {
    redirect(`/admin/promoters/${organizerId}`);
  }

  await db.organizerApproval.upsert({
    where: {
      organizerId_city_state: {
        organizerId,
        city,
        state,
      },
    },
    create: {
      organizerId,
      city,
      state,
      autoApprove: true,
      reviewEvery,
    },
    update: {
      autoApprove: true,
      reviewEvery,
    },
  });

  redirect(`/admin/promoters/${organizerId}`);
}

async function updateTrustedCity(organizerId: string, approvalId: string, formData: FormData) {
  "use server";
  await requireAdminSession(`/admin/promoters/${organizerId}`);
  await db.organizerApproval.update({
    where: { id: approvalId },
    data: {
      autoApprove: true,
      reviewEvery: readReviewEvery(formData),
    },
  });
  redirect(`/admin/promoters/${organizerId}`);
}

async function removeTrustedCity(organizerId: string, approvalId: string) {
  "use server";
  await requireAdminSession(`/admin/promoters/${organizerId}`);
  await db.organizerApproval.delete({ where: { id: approvalId } });
  redirect(`/admin/promoters/${organizerId}`);
}

export default async function AdminPromoterDetailPage({ params }: Props) {
  const { id } = await params;
  await requireAdminSession(`/admin/promoters/${id}`);
  const promoter = await getAdminPromoterById(id);

  if (!promoter) notFound();

  const verifyAction = toggleVerified.bind(null, promoter.id, !promoter.verified);

  return (
    <div className="max-w-5xl p-6 lg:p-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/promoters" className="text-sm text-brand-600 hover:underline">
          ← Back to Promoters
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{promoter.name}</h1>
            {promoter.verified && (
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                Verified promoter
              </span>
            )}
          </div>
          <p className="mt-2 text-slate-500">
            {promoter.user?.email ?? promoter.email ?? "No account email on file"}
          </p>
        </div>

        <form action={verifyAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {promoter.verified ? "Remove verification" : "Mark verified"}
          </button>
        </form>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total shows" value={String(promoter._count.shows)} />
        <StatCard label="Trusted cities" value={String(promoter.approvals.length)} />
        <StatCard
          label="Account created"
          value={
            promoter.user?.createdAt
              ? new Date(promoter.user.createdAt).toLocaleDateString()
              : "No login account"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Trusted cities</h2>
          </div>

          <div className="p-5">
            <form action={createTrustedCity.bind(null, promoter.id)} className="grid gap-4 sm:grid-cols-4">
              <input
                name="city"
                type="text"
                placeholder="City"
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                name="state"
                type="text"
                maxLength={2}
                placeholder="ST"
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                name="reviewEvery"
                type="number"
                min={1}
                max={10}
                defaultValue={4}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Add city
              </button>
            </form>

            {promoter.approvals.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">
                No trusted cities yet. Add one here or grant it during submission review.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {promoter.approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {approval.city}, {approval.state}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Auto-approve on · {approval.approvedShowCount} approved shows · spot check every{" "}
                        {approval.reviewEvery}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form
                        action={updateTrustedCity.bind(null, promoter.id, approval.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          name="reviewEvery"
                          type="number"
                          min={1}
                          max={10}
                          defaultValue={approval.reviewEvery}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                        >
                          Update
                        </button>
                      </form>
                      <form action={removeTrustedCity.bind(null, promoter.id, approval.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Profile</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <Field label="Organizer email" value={promoter.email ?? "—"} />
            <Field label="Account email" value={promoter.user?.email ?? "—"} />
            <Field label="Website" value={promoter.websiteUrl ?? "—"} />
            <Field label="Facebook" value={promoter.facebookUrl ?? "—"} />
            <Field label="Instagram" value={promoter.instagramUrl ?? "—"} />
            <Field label="Organizer ID" value={promoter.id} mono />
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Recent shows</h2>
        </div>
        {promoter.shows.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No published shows yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {promoter.shows.map((show) => (
              <div key={show.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{show.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {show.city}, {show.state} · {formatShowDate(show.startDate, show.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {show.status.toLowerCase()}
                  </span>
                  <Link
                    href={`/admin/shows/${show.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <span className="w-28 shrink-0 pt-0.5 text-xs font-medium text-slate-400">{label}</span>
      <span className={`break-words text-sm text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
