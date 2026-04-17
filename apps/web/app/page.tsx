import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  Trophy,
} from "lucide-react";
import { ShowCard } from "@/components/shows/show-card";
import { getHomepageDirectoryStats, getFeaturedShows, getUpcomingShows } from "@/lib/shows";
import { CORE_MARKET_CODES, getStatesByCodes } from "@/lib/states";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Card Show Nation | Find Upcoming Card Shows",
  description:
    "Discover upcoming sports card, Pokemon, and TCG shows by state, city, and date. Card Show Nation starts in the Midwest and is built to scale nationally.",
};

const launchStates = getStatesByCodes(CORE_MARKET_CODES);

const valueProps = [
  {
    icon: Search,
    title: "Built for collectors",
    description:
      "Scan upcoming shows fast by state, city, and weekend instead of hunting through scattered social posts.",
  },
  {
    icon: Store,
    title: "Useful for promoters",
    description:
      "Every listing has room for admission, venue, vendor, and organizer details so the page works as a real event profile.",
  },
  {
    icon: ShieldCheck,
    title: "Simple to maintain",
    description:
      "The MVP uses a clean Prisma-backed event model that can later accept imports from a Google Sheet or a lightweight admin CMS.",
  },
];

export default async function HomePage() {
  const [featuredShows, upcomingShows, stats] = await Promise.all([
    getFeaturedShows(4),
    getUpcomingShows({ limit: 6 }),
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

      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="container-wide relative py-16 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-[-12rem] hidden w-[28rem] rounded-full bg-brand-500/20 blur-3xl md:block"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-300">
                Midwest first, national ready
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Find the next card show worth your weekend.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Card Show Nation is a card show directory for collectors,
                vendors, and organizers. The launch focus is Kansas, Missouri,
                Oklahoma, Nebraska, Iowa, and Illinois, with a structure that
                can scale into a national show discovery platform.
              </p>

              <form action="/card-shows" method="GET" className="mt-8 max-w-2xl">
                <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="q"
                      placeholder="Search by show name, city, venue, or organizer"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
                  >
                    Search shows
                  </button>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/card-shows"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  Browse all upcoming shows
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/submit-show"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Submit a show
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Upcoming shows</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats.upcomingShows}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Active states</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats.activeStates}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Promoters listed</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {stats.activeOrganizers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide py-14 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Launch states
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Browse the core Midwest footprint
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Start with the states collectors around Kansas Card Show already
              travel between, then expand outward without rebuilding the site
              structure.
            </p>
          </div>
          <Link
            href="/card-shows"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            View the full directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {launchStates.map((state) => (
            <Link
              key={state.code}
              href={`/card-shows/${state.slug}`}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-4 transition-all hover:border-brand-200 hover:bg-brand-50"
            >
              <p className="text-sm font-semibold text-slate-950">{state.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                {state.code}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-wide pb-14 sm:pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Featured shows
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Upcoming card shows to spotlight
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            These are the events getting front-of-site placement. This is where
            premium listings, sponsorships, and promoter visibility can expand later.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {featuredShows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </section>

      <section className="container-wide pb-14 sm:pb-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {valueProps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-wide pb-14 sm:pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              Coming up
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              More upcoming shows in the directory
            </h2>
          </div>
          <Link
            href="/card-shows"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
          >
            Browse every listing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcomingShows.shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </section>

      <section className="container-wide pb-16">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">
                For promoters
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Get your show in front of collectors planning their weekends.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                The MVP keeps the submission flow simple now and leaves space for
                organizer profiles, premium listings, dashboards, and event tools later.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-brand-300" />
                <p className="text-sm text-slate-200">
                  Publish core event details once and keep a clean source of truth.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-brand-300" />
                <p className="text-sm text-slate-200">
                  Reach local collectors searching by state, metro, and venue.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 h-5 w-5 text-brand-300" />
                <p className="text-sm text-slate-200">
                  Reserve room for featured placement, sponsorships, and future organizer tools.
                </p>
              </div>

              <Link
                href="/submit-show"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
              >
                Submit a show
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
