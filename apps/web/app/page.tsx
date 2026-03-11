import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, ArrowRight, Calendar, TrendingUp } from "lucide-react";
import {
  getThisWeekendShows,
  getRecentlyAddedShows,
} from "@/lib/shows";
import { ShowCard } from "@/components/shows/show-card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Card Show Nation — Find Card Shows Near You",
  description:
    "Discover upcoming sports card shows, Pokémon events, TCG tournaments, and collectible shows nationwide. Search by state, city, or date.",
};

const POPULAR_STATES = [
  { name: "Texas", slug: "texas", code: "TX" },
  { name: "California", slug: "california", code: "CA" },
  { name: "Florida", slug: "florida", code: "FL" },
  { name: "Ohio", slug: "ohio", code: "OH" },
  { name: "Illinois", slug: "illinois", code: "IL" },
  { name: "Pennsylvania", slug: "pennsylvania", code: "PA" },
  { name: "Georgia", slug: "georgia", code: "GA" },
  { name: "Tennessee", slug: "tennessee", code: "TN" },
  { name: "Missouri", slug: "missouri", code: "MO" },
  { name: "North Carolina", slug: "north-carolina", code: "NC" },
  { name: "Kansas", slug: "kansas", code: "KS" },
  { name: "Oklahoma", slug: "oklahoma", code: "OK" },
];

export default async function HomePage() {
  const [weekendShows, recentShows] = await Promise.all([
    getThisWeekendShows(6),
    getRecentlyAddedShows(6),
  ]);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-brand-950 to-brand-800 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, rgba(255,255,255,0.15) 0%, transparent 60%),
                              radial-gradient(circle at 75% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        />
        <div className="container-wide relative py-20 md:py-28 text-center">
          <p className="text-brand-300 text-sm font-semibold uppercase tracking-widest mb-4">
            National Directory
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Find Card Shows
            <span className="block text-brand-300">Near You</span>
          </h1>
          <p className="mt-6 text-lg text-brand-200 max-w-xl mx-auto">
            Discover upcoming sports card shows, Pokémon events, and TCG
            tournaments across all 50 states.
          </p>

          {/* Search */}
          <form action="/card-shows" method="GET" className="mt-10 max-w-xl mx-auto">
            <div className="flex gap-2 rounded-xl bg-white/10 border border-white/20 p-1.5 backdrop-blur">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search by city, state, or show name..."
                  className="w-full bg-transparent pl-9 pr-4 py-2.5 text-white placeholder-white/50 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick state pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {POPULAR_STATES.slice(0, 6).map((state) => (
              <Link
                key={state.slug}
                href={`/card-shows/${state.slug}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── THIS WEEKEND ─────────────────────────────────── */}
      {weekendShows.length > 0 && (
        <section className="container-wide mt-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" />
              <h2 className="text-xl font-bold text-slate-900">This Weekend</h2>
            </div>
            <Link
              href="/card-shows"
              className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekendShows.map((show: any) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

      {/* ── BROWSE BY STATE ──────────────────────────────── */}
      <section className="container-wide mt-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-500" />
            <h2 className="text-xl font-bold text-slate-900">Browse by State</h2>
          </div>
          <Link
            href="/card-shows"
            className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1"
          >
            All states <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_STATES.map((state) => (
            <Link
              key={state.slug}
              href={`/card-shows/${state.slug}`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center hover:border-brand-300 hover:bg-brand-50 transition-all group"
            >
              <div className="text-2xl font-bold text-slate-300 group-hover:text-brand-200 transition-colors">
                {state.code}
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5 group-hover:text-brand-700 transition-colors">
                {state.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── RECENTLY ADDED ───────────────────────────────── */}
      {recentShows.length > 0 && (
        <section className="container-wide mt-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-500" />
              <h2 className="text-xl font-bold text-slate-900">Recently Added</h2>
            </div>
            <Link
              href="/card-shows"
              className="text-sm font-medium text-brand-600 hover:underline flex items-center gap-1"
            >
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentShows.map((show: any) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

      {/* ── SUBMIT CTA ───────────────────────────────────── */}
      <section className="container-wide mt-20 mb-16">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Organizing a Card Show?</h2>
          <p className="mt-3 text-brand-200 max-w-md mx-auto">
            Submit your show and reach collectors across the country. Listings
            are reviewed and go live within 24 hours.
          </p>
          <Link
            href="/submit-show"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Submit Your Show <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
