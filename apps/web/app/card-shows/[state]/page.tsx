import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getShowsByState, getCitiesWithShows } from "@/lib/shows";
import { ShowCard } from "@/components/shows/show-card";

export const revalidate = 3600;

type Props = { params: Promise<{ state: string }> };

export async function generateStaticParams() {
  const states = await db.state.findMany({ select: { slug: true } });
  return states.map((s: any) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateRecord = await db.state.findUnique({ where: { slug: state } });
  if (!stateRecord) return {};
  return {
    title: `Card Shows in ${stateRecord.name}`,
    description:
      stateRecord.seoBlurb ??
      `Find upcoming sports card shows, Pokémon events, and TCG tournaments in ${stateRecord.name}.`,
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const stateRecord = await db.state.findUnique({ where: { slug: state } });
  if (!stateRecord) notFound();

  const stateCode = stateRecord.id;
  const [shows, cities] = await Promise.all([
    getShowsByState(stateCode, 24),
    getCitiesWithShows(stateCode),
  ]);

  return (
    <div className="container-wide py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2">
        <Link href="/card-shows" className="hover:text-brand-600 transition-colors">
          Card Shows
        </Link>
        <span>/</span>
        <span className="text-slate-700">{stateRecord.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">
        Card Shows in {stateRecord.name}
      </h1>

      {stateRecord.seoBlurb && (
        <p className="mt-3 text-slate-500 max-w-2xl leading-relaxed">
          {stateRecord.seoBlurb}
        </p>
      )}

      {/* Browse by city */}
      {cities.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Browse by City
          </h2>
          <div className="flex flex-wrap gap-2">
            {cities.map(({ city, count }: { city: string; count: number }) => {
              const citySlug = city.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={city}
                  href={`/card-shows/${state}/${citySlug}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
                >
                  {city}
                  <span className="ml-1.5 text-xs text-slate-400">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Shows */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Upcoming Shows in {stateRecord.name}
          </h2>
        </div>

        {shows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
            <p className="text-slate-500">No upcoming shows in {stateRecord.name}.</p>
            <p className="mt-2 text-sm text-slate-400">
              Know of a show?{" "}
              <Link href="/submit-show" className="text-brand-600 hover:underline">
                Submit it here
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shows.map((show: any) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-brand-100 bg-brand-50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-brand-900">
            Organizing a show in {stateRecord.name}?
          </p>
          <p className="text-sm text-brand-600 mt-0.5">
            Submit your listing and reach collectors statewide.
          </p>
        </div>
        <Link
          href="/submit-show"
          className="shrink-0 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Submit a Show
        </Link>
      </div>
    </div>
  );
}
