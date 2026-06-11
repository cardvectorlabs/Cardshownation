import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Grid3X3, Ruler, Store } from "lucide-react";
import { getPromoterSession } from "@/lib/promoter-auth";

export const metadata: Metadata = {
  title: "Floorplanner",
  description:
    "Open the browser-based Floorplanner workspace for Card Show Nation show layouts.",
};

const featureCards = [
  {
    title: "Design around real show flow",
    body: "Lay out aisles, tables, and vendor zones in a workspace built for event operations instead of generic drawing tools.",
    icon: Grid3X3,
  },
  {
    title: "Plan booth density faster",
    body: "Pressure-test table counts, circulation, and placement decisions before the floor opens to vendors and attendees.",
    icon: Ruler,
  },
  {
    title: "Built for card show operations",
    body: "Use a floor planning workflow tied directly to Card Show Nation's show management stack and event records.",
    icon: Store,
  },
];

export const dynamic = "force-dynamic";

export default async function FloorplannerLandingPage() {
  const promoterSession = await getPromoterSession();
  const promoterHref = promoterSession ? "/promoter" : "/promoter/login";
  const promoterLabel = promoterSession ? "Open promoter workspace" : "Promoter login";

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-wide py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              Browser App
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Floorplanner for card shows.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Floorplanner is the browser workspace for building vendor layouts,
              table maps, and event-ready show floors. Sign in to open your show
              workspace instead of using a generic brochure page.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={promoterHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {promoterLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/floorplanner"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
            >
              Admin workspace
            </Link>
          </div>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {featureCards.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-wide pb-14">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white sm:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold">Open the app, then open a show.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Promoters manage their own show floorplans from the browser-based
              workspace, and admins can still reach the same editor from the
              back office when they need oversight or support.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
