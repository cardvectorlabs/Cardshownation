import Link from "next/link";
import { Calendar, MapPin, Tag } from "lucide-react";
import { formatShowDate } from "@/lib/utils";
import type { ShowCard } from "@/types";

export function ShowCard({ show }: { show: ShowCard }) {
  const dateLabel = formatShowDate(show.startDate, show.endDate);

  return (
    <Link
      href={`/shows/${show.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-md transition-all overflow-hidden"
    >
      {/* Flyer image or placeholder */}
      {show.flyerImageUrl ? (
        <div className="h-36 overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={show.flyerImageUrl}
            alt={`${show.title} flyer`}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-700" />
      )}

      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
          {show.title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-400" />
          <span>{dateLabel}</span>
          {show.startTimeLabel && (
            <span className="text-slate-400">· {show.startTimeLabel}</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-400" />
          <span>
            {show.city}, {show.state}
          </span>
          {show.venue && (
            <span className="text-slate-400 truncate">· {show.venue.name}</span>
          )}
        </div>

        {/* Footer: categories + admission */}
        <div className="mt-auto flex items-center justify-between pt-2 gap-2">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1 min-w-0">
            {show.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                <Tag className="h-2.5 w-2.5" />
                {cat}
              </span>
            ))}
            {show.categories.length > 2 && (
              <span className="text-xs text-slate-400">
                +{show.categories.length - 2}
              </span>
            )}
          </div>

          {/* Admission */}
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              show.isFree
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {show.isFree ? "Free" : show.admissionPrice ?? "Paid"}
          </span>
        </div>
      </div>
    </Link>
  );
}
