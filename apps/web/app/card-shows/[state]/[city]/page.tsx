import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShowCard } from "@/components/shows/show-card";
import { getShowsByCity } from "@/lib/shows";
import { getStateBySlug } from "@/lib/states";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ state: string; city: string }>;
};

function citySlugToName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const stateRecord = getStateBySlug(state);
  const cityName = citySlugToName(city);

  if (!stateRecord) return {};

  return {
    title: `${cityName}, ${stateRecord.name} Card Shows`,
    description: `Find upcoming sports card, Pokemon, and TCG shows in ${cityName}, ${stateRecord.name}.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const stateRecord = getStateBySlug(state);

  if (!stateRecord) notFound();

  const cityName = citySlugToName(city);
  const shows = await getShowsByCity(stateRecord.code, cityName, 24);

  return (
    <div className="container-wide py-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/card-shows" className="transition-colors hover:text-brand-700">
          Card shows
        </Link>
        <span>/</span>
        <Link
          href={`/card-shows/${stateRecord.slug}`}
          className="transition-colors hover:text-brand-700"
        >
          {stateRecord.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900">{cityName}</span>
      </nav>

      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Card shows in {cityName}, {stateRecord.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Browse upcoming listings in {cityName} with event dates, venue details,
          admission info, and promoter context.
        </p>
      </div>

      <section className="mt-10">
        {shows.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No upcoming shows are listed in {cityName} yet.
            </p>
            <div className="mt-4 flex flex-col items-center gap-3 text-sm">
              <Link
                href={`/card-shows/${stateRecord.slug}`}
                className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
              >
                Browse all {stateRecord.name} shows
              </Link>
              <Link
                href="/submit-show"
                className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
              >
                Submit a show
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
