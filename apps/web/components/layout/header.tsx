import Link from "next/link";
import { MapPin, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="container-wide flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 leading-tight">
            Card Show<br className="hidden" />
            <span className="text-brand-600"> Nation</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/card-shows"
            className="text-slate-600 hover:text-brand-600 transition-colors"
          >
            Browse Shows
          </Link>
          <Link
            href="/submit-show"
            className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 transition-colors"
          >
            Submit a Show
          </Link>
        </nav>

        {/* Mobile nav placeholder */}
        <button className="flex md:hidden items-center justify-center h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
