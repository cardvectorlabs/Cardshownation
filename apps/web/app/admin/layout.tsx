import Link from "next/link";
import { LayoutDashboard, ListChecks, Send, Upload, RefreshCw, Users } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-slate-200 bg-white shrink-0">
        <div className="px-4 py-5 border-b border-slate-100">
          <Link href="/admin" className="text-sm font-bold text-slate-900">
            CSN Admin
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">Card Show Nation</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/submissions", label: "Submissions", icon: Send },
            { href: "/admin/shows", label: "All Shows", icon: ListChecks },
            { href: "/admin/promoters", label: "Promoters", icon: Users },
            { href: "/admin/import", label: "Import CSV", icon: Upload },
            { href: "/admin/imports", label: "Auto-Import", icon: RefreshCw },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← View site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-slate-50 min-w-0">{children}</main>
    </div>
  );
}
