import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ShowListItem } from "@/components/shows/show-list-item";
import { getHomepageDirectoryStats, getUpcomingShows } from "@/lib/shows";
import { US_STATES } from "@/lib/states";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Card Show Nation | Find Upcoming Card Shows",
  description:
    "The national card show directory. Find upcoming sports card, Pokemon, and TCG shows by state, city, and date.",
};

export default async function HomePage() {
  const [upcomingShows, stats] = await Promise.all([
    getUpcomingShows({ limit: 8 }),
    getHomepageDirectoryStats(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Card Show Nation",
    url: "https://cardshownation.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://cardshownation.com/card-shows?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-slate-950 text-white">
        <div className="container-wide py-10 sm:py-14">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Find card shows near you.
          </h1>
          <p className="mt-2 text-slate-400">
            {stats.upcomingShows} upcoming shows across {stats.activeStates} states.
          </p>

          <form action="/card-shows" method="GET" className="mt-6 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="City, state, or show name"
                className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-400 whitespace-nowrap"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex gap-3">
            <Link
              href="/card-shows"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Browse all shows
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/submit-show"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Submit a show
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming shows */}
      <section className="container-wide py-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">Upcoming shows</h2>
          <Link
            href="/card-shows"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {upcomingShows.shows.map((show) => (
            <ShowListItem key={show.id} show={show} />
          ))}
        </div>
      </section>

      {/* State directory */}
      <section className="container-wide pb-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">Browse by state</h2>
          <Link
            href="/card-shows"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Full directory
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {US_STATES.map((state) => (
            <Link
              key={state.code}
              href={`/card-shows/${state.slug}`}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-800 transition-all hover:border-brand-200 hover:bg-brand-50"
            >
              {state.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Promoter CTA */}
      <section className="container-wide pb-12">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">Organizing a show?</p>
            <p className="mt-1 text-sm text-slate-400">Free to list. Goes live after a quick review.</p>
          </div>
          <Link
            href="/submit-show"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 shrink-0"
          >
            Submit a show
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
