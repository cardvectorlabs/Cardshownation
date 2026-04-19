"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

export function ViewToggle({ current }: { current: "grid" | "list" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(view: "grid" | "list") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`/card-shows?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => setView("grid")}
        className={`rounded-lg p-1.5 transition-colors ${
          current === "grid"
            ? "bg-slate-100 text-slate-900"
            : "text-slate-400 hover:text-slate-600"
        }`}
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setView("list")}
        className={`rounded-lg p-1.5 transition-colors ${
          current === "list"
            ? "bg-slate-100 text-slate-900"
            : "text-slate-400 hover:text-slate-600"
        }`}
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
