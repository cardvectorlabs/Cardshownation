import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, LocateFixed, MapPin, Search } from "lucide-react";
import { NearMeButton } from "@/components/shows/near-me-button";
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
    getUpcomingShows({ limit: 8 }).catch((err) => {
      console.error("[HomePage] getUpcomingShows failed, rendering empty list:", err);
      return { shows: [], total: 0 };
    }),
    getHomepageDirectoryStats().catch((err) => {
      console.error("[HomePage] getHomepageDirectoryStats failed, rendering zeros:", err);
      return { upcomingShows: 0, activeStates: 0, activeOrganizers: 0 };
    }),
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

  const heroShows = upcomingShows.shows.slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(251,191,36,0.16),transparent_24%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="container-wide relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
              <LocateFixed className="h-3.5 w-3.5" />
              GPS-first discovery
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Find card shows without digging through every state.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Search by city, show name, or promoter. Use your location first,
              then widen out when you want more options. Every listing is built
              around the details people actually ask for: hours, admission,
              tables, venue, directions, and promoter links.
            </p>

            <form
              action="/card-shows"
              method="GET"
              className="mt-8 flex max-w-xl gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="City, state, promoter, or show name"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="whitespace-nowrap rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
              >
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <NearMeButton
                isActive={false}
                label="Use my location"
                tone="dark"
                align="start"
              />

              <div className="flex flex-wrap gap-3">
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

            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-semibold text-white">
                  {stats.upcomingShows.toLocaleString()}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  Upcoming Shows
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-semibold text-white">{stats.activeStates}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  Active States
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-semibold text-white">{stats.activeOrganizers}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  Promoters Listed
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-200">
                  Weekend radar
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  A few upcoming stops to start from if you just want something
                  solid on the calendar.
                </p>
              </div>
              <Link
                href="/card-shows"
                className="shrink-0 text-sm font-semibold text-white transition-colors hover:text-brand-200"
              >
                Directory
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {heroShows.length > 0 ? (
                heroShows.map((show) => (
                  <Link
                    key={show.id}
                    href={`/shows/${show.slug}`}
                    className="group block rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4 transition-colors hover:border-brand-300/40 hover:bg-slate-950/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">
                          {show.title}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-200" />
                            {show.city}, {show.state}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-brand-200" />
                            {show.startTimeLabel ??
                              new Date(show.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-200" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {show.categories.slice(0, 2).map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-slate-950/30 p-4 text-sm text-slate-300">
                  Upcoming shows will land here as listings are verified.
                </div>
              )}
            </div>
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
