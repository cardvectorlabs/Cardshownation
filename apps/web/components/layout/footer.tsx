import Link from "next/link";
import { MapPin } from "lucide-react";

const STATES_GRID = [
  ["Texas", "texas"], ["California", "california"], ["Florida", "florida"],
  ["Ohio", "ohio"], ["Illinois", "illinois"], ["Pennsylvania", "pennsylvania"],
  ["Georgia", "georgia"], ["Tennessee", "tennessee"], ["Missouri", "missouri"],
  ["North Carolina", "north-carolina"], ["Kansas", "kansas"], ["Oklahoma", "oklahoma"],
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900">
                Card Show Nation
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The national directory for sports card shows, Pokémon events, and
              TCG tournaments across all 50 states.
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-sm">
              <Link
                href="/submit-show"
                className="text-brand-600 hover:underline font-medium"
              >
                Submit a Show →
              </Link>
              <Link
                href="/card-shows"
                className="text-slate-500 hover:text-brand-600 transition-colors"
              >
                Browse All Shows
              </Link>
            </div>
          </div>

          {/* Popular states */}
          <div className="md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Browse by State
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5">
              {STATES_GRID.map(([name, slug]) => (
                <Link
                  key={slug}
                  href={`/card-shows/${slug}`}
                  className="text-sm text-slate-500 hover:text-brand-600 transition-colors"
                >
                  {name}
                </Link>
              ))}
              <Link
                href="/card-shows"
                className="text-sm text-brand-500 hover:text-brand-700 font-medium"
              >
                All 50 States →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Card Show Nation. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/submit-show" className="hover:text-slate-600 transition-colors">
              Submit a Show
            </Link>
            <Link href="/admin" className="hover:text-slate-600 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
