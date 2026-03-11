import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  ExternalLink,
  Flag,
  Tag,
} from "lucide-react";
import { getShowBySlug } from "@/lib/shows";
import { formatShowDate, stateCodeToSlug } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) return {};
  return {
    title: show.title,
    description:
      show.description ??
      `${show.title} — ${formatShowDate(show.startDate, show.endDate)} in ${show.city}, ${show.state}. Find sports card shows and TCG events on Card Show Nation.`,
  };
}

export default async function ShowDetailPage({ params }: Props) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show || show.status !== "APPROVED") notFound();

  const stateSlug = stateCodeToSlug(show.state);
  const citySlug = show.city.toLowerCase().replace(/\s+/g, "-");
  const mapsQuery = encodeURIComponent(
    `${show.venue?.address1 ?? ""} ${show.city} ${show.state}`.trim()
  );

  // JSON-LD Event schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: show.title,
    startDate: show.startDate.toISOString(),
    endDate: show.endDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: show.venue?.name ?? `${show.city}, ${show.state}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: show.venue?.address1,
        addressLocality: show.city,
        addressRegion: show.state,
        postalCode: show.venue?.postalCode,
        addressCountry: "US",
      },
    },
    ...(show.flyerImageUrl ? { image: show.flyerImageUrl } : {}),
    ...(show.description ? { description: show.description } : {}),
    ...(show.organizer ? { organizer: { "@type": "Organization", name: show.organizer.name } } : {}),
    isAccessibleForFree: show.isFree,
    ...(show.websiteUrl ? { url: show.websiteUrl } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-wide py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/card-shows" className="hover:text-brand-600">Card Shows</Link>
          <span>/</span>
          <Link href={`/card-shows/${stateSlug}`} className="hover:text-brand-600">
            {show.state}
          </Link>
          <span>/</span>
          <Link href={`/card-shows/${stateSlug}/${citySlug}`} className="hover:text-brand-600">
            {show.city}
          </Link>
          <span>/</span>
          <span className="text-slate-700 truncate max-w-[200px]">{show.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Main content ── */}
          <div className="lg:col-span-2">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {show.categories.map((cat: any) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  <Tag className="h-3 w-3" />
                  {cat}
                </span>
              ))}
              {show.isFree && (
                <span className="rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Free Admission
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              {show.title}
            </h1>

            {/* Flyer */}
            {show.flyerImageUrl && (
              <div className="mt-6 rounded-xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={show.flyerImageUrl}
                  alt={`${show.title} flyer`}
                  className="w-full max-h-96 object-contain bg-slate-50"
                />
              </div>
            )}

            {/* Description */}
            {show.description && (
              <div className="mt-6">
                <h2 className="text-base font-semibold text-slate-900 mb-2">About This Show</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {show.description}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dates */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="h-4 w-4 text-brand-500" />
                  Dates
                </div>
                <p className="text-slate-900 font-medium">
                  {formatShowDate(show.startDate, show.endDate)}
                </p>
                {(show.startTimeLabel || show.endTimeLabel) && (
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {show.startTimeLabel}
                    {show.endTimeLabel && ` – ${show.endTimeLabel}`}
                  </p>
                )}
              </div>

              {/* Admission */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <DollarSign className="h-4 w-4 text-brand-500" />
                  Admission
                </div>
                <p className="text-slate-900 font-medium">
                  {show.isFree ? "Free" : show.admissionPrice ?? "Paid"}
                </p>
                {show.admissionNotes && (
                  <p className="text-sm text-slate-500 mt-1">{show.admissionNotes}</p>
                )}
              </div>

              {/* Table count */}
              {show.tableCount && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Users className="h-4 w-4 text-brand-500" />
                    Scale
                  </div>
                  <p className="text-slate-900 font-medium">
                    ~{show.tableCount.toLocaleString()} tables
                  </p>
                </div>
              )}

              {/* Parking */}
              {(show.parkingInfo ?? show.venue?.parkingInfo) && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    Parking
                  </div>
                  <p className="text-slate-600 text-sm">
                    {show.parkingInfo ?? show.venue?.parkingInfo}
                  </p>
                </div>
              )}
            </div>

            {/* External links */}
            {(show.websiteUrl || show.facebookUrl || show.ticketUrl) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {show.websiteUrl && (
                  <a
                    href={show.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
                {show.facebookUrl && (
                  <a
                    href={show.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Facebook Event
                  </a>
                )}
                {show.ticketUrl && (
                  <a
                    href={show.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Get Tickets
                  </a>
                )}
              </div>
            )}

            {/* Report */}
            <div className="mt-10 pt-6 border-t border-slate-100">
              <Link
                href={`/report-show?show=${show.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                <Flag className="h-3.5 w-3.5" />
                Report incorrect info
              </Link>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Venue */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" />
                Venue
              </h2>
              {show.venue ? (
                <>
                  <p className="font-medium text-slate-900">{show.venue.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{show.venue.address1}</p>
                  {show.venue.address2 && (
                    <p className="text-sm text-slate-500">{show.venue.address2}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {show.city}, {show.state} {show.venue.postalCode}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  {show.city}, {show.state}
                </p>
              )}
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm text-brand-600 hover:underline"
              >
                Get Directions →
              </a>
            </div>

            {/* Organizer */}
            {show.organizer && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Organizer
                </h2>
                <p className="font-medium text-slate-900">{show.organizer.name}</p>
                {show.organizer.websiteUrl && (
                  <a
                    href={show.organizer.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-brand-600 hover:underline"
                  >
                    {show.organizer.websiteUrl}
                  </a>
                )}
              </div>
            )}

            {/* Add to calendar (placeholder) */}
            <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-sm font-semibold text-brand-900 mb-1">
                Don&apos;t miss this show
              </p>
              <p className="text-xs text-brand-600">
                Save this show to your collection — login coming soon.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
