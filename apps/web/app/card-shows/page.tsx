import type { Metadata } from "next";
import Link from "next/link";
import { getUpcomingShows, SHOW_CATEGORIES } from "@/lib/shows";
import { ShowCard } from "@/components/shows/show-card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse Card Shows Nationwide",
  description:
    "Search and filter upcoming sports card shows, Pokémon events, and TCG tournaments across all 50 states.",
};

type SearchParams = {
  state?: string;
  city?: string;
  category?: string;
  free?: string;
  q?: string;
  page?: string;
};

const US_STATES = [
  { code: "AL", name: "Alabama", slug: "alabama" },
  { code: "AK", name: "Alaska", slug: "alaska" },
  { code: "AZ", name: "Arizona", slug: "arizona" },
  { code: "AR", name: "Arkansas", slug: "arkansas" },
  { code: "CA", name: "California", slug: "california" },
  { code: "CO", name: "Colorado", slug: "colorado" },
  { code: "CT", name: "Connecticut", slug: "connecticut" },
  { code: "DE", name: "Delaware", slug: "delaware" },
  { code: "FL", name: "Florida", slug: "florida" },
  { code: "GA", name: "Georgia", slug: "georgia" },
  { code: "HI", name: "Hawaii", slug: "hawaii" },
  { code: "ID", name: "Idaho", slug: "idaho" },
  { code: "IL", name: "Illinois", slug: "illinois" },
  { code: "IN", name: "Indiana", slug: "indiana" },
  { code: "IA", name: "Iowa", slug: "iowa" },
  { code: "KS", name: "Kansas", slug: "kansas" },
  { code: "KY", name: "Kentucky", slug: "kentucky" },
  { code: "LA", name: "Louisiana", slug: "louisiana" },
  { code: "ME", name: "Maine", slug: "maine" },
  { code: "MD", name: "Maryland", slug: "maryland" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts" },
  { code: "MI", name: "Michigan", slug: "michigan" },
  { code: "MN", name: "Minnesota", slug: "minnesota" },
  { code: "MS", name: "Mississippi", slug: "mississippi" },
  { code: "MO", name: "Missouri", slug: "missouri" },
  { code: "MT", name: "Montana", slug: "montana" },
  { code: "NE", name: "Nebraska", slug: "nebraska" },
  { code: "NV", name: "Nevada", slug: "nevada" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey" },
  { code: "NM", name: "New Mexico", slug: "new-mexico" },
  { code: "NY", name: "New York", slug: "new-york" },
  { code: "NC", name: "North Carolina", slug: "north-carolina" },
  { code: "ND", name: "North Dakota", slug: "north-dakota" },
  { code: "OH", name: "Ohio", slug: "ohio" },
  { code: "OK", name: "Oklahoma", slug: "oklahoma" },
  { code: "OR", name: "Oregon", slug: "oregon" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island" },
  { code: "SC", name: "South Carolina", slug: "south-carolina" },
  { code: "SD", name: "South Dakota", slug: "south-dakota" },
  { code: "TN", name: "Tennessee", slug: "tennessee" },
  { code: "TX", name: "Texas", slug: "texas" },
  { code: "UT", name: "Utah", slug: "utah" },
  { code: "VT", name: "Vermont", slug: "vermont" },
  { code: "VA", name: "Virginia", slug: "virginia" },
  { code: "WA", name: "Washington", slug: "washington" },
  { code: "WV", name: "West Virginia", slug: "west-virginia" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin" },
  { code: "WY", name: "Wyoming", slug: "wyoming" },
];

export default async function CardShowsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  const { shows, total } = await getUpcomingShows({
    state: sp.state,
    city: sp.city,
    category: sp.category,
    isFree: sp.free === "1" ? true : undefined,
    q: sp.q,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(
    sp.state ||
    sp.city ||
    sp.category ||
    sp.free ||
    sp.q
  );

  const stateName = US_STATES.find((s) => s.code === sp.state)?.name;

  return (
    <div className="container-wide py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {stateName
            ? `Card Shows in ${stateName}`
            : "Browse Card Shows Nationwide"}
        </h1>
        <p className="mt-2 text-slate-500">
          {total.toLocaleString()} upcoming show{total !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Filters sidebar ── */}
        <aside className="lg:w-56 shrink-0">
          <div className="sticky top-20 space-y-6">
            {hasFilters && (
              <Link
                href="/card-shows"
                className="block text-sm text-brand-600 font-medium hover:underline"
              >
                ← Clear filters
              </Link>
            )}

            {/* Search */}
            <form method="GET" action="/card-shows">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Search
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={sp.q ?? ""}
                  placeholder="City or show name..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {sp.state && (
                  <input type="hidden" name="state" value={sp.state} />
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-3 text-white hover:bg-brand-700 transition-colors"
                >
                  →
                </button>
              </div>
            </form>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                State
              </label>
              <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                {US_STATES.map((s: any) => (
                  <Link
                    key={s.code}
                    href={`/card-shows/${s.slug}`}
                    className={`block rounded px-2 py-1 text-sm transition-colors ${
                      sp.state === s.code
                        ? "bg-brand-100 text-brand-700 font-medium"
                        : "text-slate-500 hover:text-brand-600 hover:bg-brand-50"
                    }`}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Category
              </label>
              <div className="space-y-1">
                {SHOW_CATEGORIES.map((cat: any) => {
                  const isActive = sp.category === cat;
                  const params = new URLSearchParams();
                  if (sp.state) params.set("state", sp.state);
                  if (sp.free) params.set("free", sp.free);
                  if (!isActive) params.set("category", cat);
                  return (
                    <Link
                      key={cat}
                      href={`/card-shows?${params}`}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-brand-100 text-brand-700 font-medium"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Free only */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Admission
              </label>
              <Link
                href={
                  sp.free === "1"
                    ? "/card-shows"
                    : `/card-shows?free=1${sp.state ? `&state=${sp.state}` : ""}`
                }
                className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  sp.free === "1"
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Free admission only
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0">
          {shows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
              <p className="text-slate-500">No shows found.</p>
              {hasFilters && (
                <Link
                  href="/card-shows"
                  className="mt-3 inline-block text-sm text-brand-600 font-medium hover:underline"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {shows.map((show: any) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/card-shows?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="text-sm text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/card-shows?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
