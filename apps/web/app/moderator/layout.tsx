import Link from "next/link";
import { ClipboardCheck, LayoutDashboard, LogIn } from "lucide-react";

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 px-4 py-5">
          <Link href="/moderator" className="text-sm font-bold text-slate-900">
            CSN Moderator
          </Link>
          <p className="mt-0.5 text-xs text-slate-400">Review queue</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {[
            { href: "/moderator", label: "Dashboard", icon: LayoutDashboard },
            { href: "/moderator/submissions", label: "Submissions", icon: ClipboardCheck },
            { href: "/moderator/login", label: "Login", icon: LogIn },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

