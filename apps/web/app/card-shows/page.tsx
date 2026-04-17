import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ShowCard } from "@/components/shows/show-card";
import { SHOW_CATEGORIES, getUpcomingShows } from "@/lib/shows";
import { US_STATES, getStateByCode } from "@/lib/states";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Card Shows",
  description:
    "Browse upcoming card shows by state, city, venue, and category. Card Show Nation is built for collectors, vendors, and promoters.",
};

type SearchParams = {
  state?: string;
  city?: string;
  category?: string;
  free?: string;
  q?: string;
  page?: string;
};

function buildQuery(
  current: SearchParams,
  overrides: Partial<Record<keyof SearchParams, string | undefined>>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };

  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
}

export default async function CardShowsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const limit = 18;
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

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = Boolean(sp.state || sp.city || sp.category || sp.free || sp.q);
  const stateName = getStateByCode(sp.state)?.name;

  return (
    <div className="container-wide py-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Show directory
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {stateName ? `${stateName} card shows` : "Browse upcoming card shows"}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Search by show name, city, promoter, or venue. State pages carry the
          strongest SEO value, while this directory page handles broader
          filtering and discovery.
        </p>

        <form action="/card-shows" method="GET" className="mt-6 grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search by show, city, venue, or promoter"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <select
            name="state"
            defaultValue={sp.state ?? ""}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
          >
            <option value="">All states</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>

          <select
            name="category"
            defaultValue={sp.category ?? ""}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
          >
            <option value="">All categories</option>
            {SHOW_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Search
          </button>

          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="free"
              value="1"
              defaultChecked={sp.free === "1"}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Free admission only
          </label>
        </form>

        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">Filters active</span>
            <Link
              href="/card-shows"
              className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              Clear filters
            </Link>
          </div>
        )}
      </section>

      {!hasFilters && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Jump to a state page
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                State pages are the best entry point for SEO and for collectors
                planning a local trip.
              </p>
            </div>
            <Link
              href="/submit-show"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              Submit a show
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {US_STATES.map((state) => (
              <Link
                key={state.code}
                href={`/card-shows/${state.slug}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              {total.toLocaleString()} upcoming show{total === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {stateName
                ? `Current results for ${stateName}.`
                : "Results across the current Card Show Nation directory."}
            </p>
          </div>
        </div>

        {shows.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No shows match those filters.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Try broadening the search, removing a category, or browsing a state page.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/card-shows?${buildQuery(sp, { page: String(page - 1) })}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Previous
            </Link>
          )}

          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>

          {page < totalPages && (
            <Link
              href={`/card-shows?${buildQuery(sp, { page: String(page + 1) })}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
