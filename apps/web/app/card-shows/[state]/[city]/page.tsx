import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getShowsByCity } from "@/lib/shows";
import { ShowCard } from "@/components/shows/show-card";

export const revalidate = 3600;

type Props = { params: Promise<{ state: string; city: string }> };

// Un-slugify city: "kansas-city" → "Kansas City"
function citySlugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const stateRecord = await db.state.findUnique({ where: { slug: state } });
  const cityName = citySlugToName(city);
  if (!stateRecord) return {};
  return {
    title: `Card Shows in ${cityName}, ${stateRecord.name}`,
    description: `Find upcoming sports card shows and TCG events in ${cityName}, ${stateRecord.name}.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const stateRecord = await db.state.findUnique({ where: { slug: state } });
  if (!stateRecord) notFound();

  const cityName = citySlugToName(city);
  const shows = await getShowsByCity(stateRecord.id, cityName, 24);

  return (
    <div className="container-wide py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/card-shows" className="hover:text-brand-600 transition-colors">
          Card Shows
        </Link>
        <span>/</span>
        <Link
          href={`/card-shows/${state}`}
          className="hover:text-brand-600 transition-colors"
        >
          {stateRecord.name}
        </Link>
        <span>/</span>
        <span className="text-slate-700">{cityName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">
        Card Shows in {cityName}, {stateRecord.name}
      </h1>
      <p className="mt-2 text-slate-500">
        {shows.length} upcoming show{shows.length !== 1 ? "s" : ""} in {cityName}
      </p>

      <div className="mt-10">
        {shows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
            <p className="text-slate-500">No upcoming shows in {cityName}.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center text-sm">
              <Link
                href={`/card-shows/${state}`}
                className="text-brand-600 hover:underline font-medium"
              >
                Browse all {stateRecord.name} shows
              </Link>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <Link
                href="/submit-show"
                className="text-brand-600 hover:underline font-medium"
              >
                Submit a show
              </Link>
            </div>
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
            Organizing a show in {cityName}?
          </p>
          <p className="text-sm text-brand-600 mt-0.5">
            Get listed and reach collectors in the area.
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
