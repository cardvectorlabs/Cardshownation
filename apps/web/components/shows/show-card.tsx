import Link from "next/link";
import { ArrowRight, Clock, MapPin, Ticket, Users } from "lucide-react";
import { getStateByCode } from "@/lib/states";
import { formatShowDate, getDateBadge } from "@/lib/utils";
import type { ShowCard as ShowCardData } from "@/types";

export function ShowCard({ show }: { show: ShowCardData }) {
  const badge = getDateBadge(show.startDate, show.endDate);
  const stateName = getStateByCode(show.state)?.name ?? show.state;
  const admissionLabel = show.isFree
    ? "Free admission"
    : show.admissionPrice ?? "Paid admission";
  const vendorLabel =
    show.vendorDetails ??
    (show.tableCount ? `${show.tableCount.toLocaleString()} tables` : null);

  return (
    <Link
      href={`/shows/${show.slug}`}
      className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
    >
      <div className="flex gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center rounded-2xl border border-brand-100 bg-brand-50 px-2 py-3 text-center">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-brand-700">
            {badge.month}
          </span>
          <span className="mt-1 text-lg font-bold leading-none text-slate-950">
            {badge.dayLabel}
          </span>
          <span className="mt-1 text-[11px] text-slate-500">{badge.weekday}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {show.featuredRank !== null && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Featured
              </span>
            )}
            {show.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                {category}
              </span>
            ))}
          </div>

          <h3 className="mt-3 text-lg font-semibold leading-tight text-slate-950 transition-colors group-hover:text-brand-700">
            {show.title}
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            {formatShowDate(show.startDate, show.endDate)}
          </p>

          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div>
                <p className="font-medium text-slate-800">
                  {show.city}, {stateName}
                </p>
                {show.venue && <p>{show.venue.name}</p>}
              </div>
            </div>

            {show.startTimeLabel && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  {show.startTimeLabel}
                  {show.endTimeLabel ? ` - ${show.endTimeLabel}` : ""}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 shrink-0 text-brand-600" />
              <span>{admissionLabel}</span>
            </div>

            {vendorLabel && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-brand-600" />
                <span>{vendorLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="font-medium text-slate-500">View full details</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
          Open
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
