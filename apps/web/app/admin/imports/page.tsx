"use client";

import { useState } from "react";
import Link from "next/link";
import { triggerEventbriteImport } from "./actions";

type RunResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export default function ImportsPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerRun() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const data = await triggerEventbriteImport();
      if ("error" in data) throw new Error(data.error);
      setResult(data as RunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Auto-Import</h1>
          <p className="mt-1 text-sm text-slate-500">
            Runs daily at 6 AM automatically via Vercel Cron. New shows land in{" "}
            <Link href="/admin/submissions" className="font-medium text-brand-600 hover:underline">
              Submissions
            </Link>{" "}
            as Pending for your review.
          </p>
        </div>
        <button
          onClick={triggerRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {running ? "Running…" : "Run now"}
        </button>
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Sources</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-slate-900">Eventbrite</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Searches public Eventbrite listings for card shows across the US
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
              <span className="text-xs text-slate-400">Daily 6 AM</span>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-slate-700">Last run result</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{result.imported}</p>
              <p className="mt-1 text-xs text-green-600">New pending submissions</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{result.skipped}</p>
              <p className="mt-1 text-xs text-slate-500">Already seen / skipped</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
              <p className="mt-1 text-xs text-red-500">Errors</p>
            </div>
          </div>
          {result.imported > 0 && (
            <div className="mt-4">
              <Link
                href="/admin/submissions"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                Review new submissions →
              </Link>
            </div>
          )}
          {result.errors.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-red-500">Show errors</summary>
              <pre className="mt-2 overflow-x-auto rounded bg-red-50 p-3 text-xs text-red-700">
                {result.errors.join("\n")}
              </pre>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          {error.includes("EVENTBRITE_API_KEY") && (
            <p className="mt-3 text-xs text-red-500">
              Add <code className="rounded bg-red-100 px-1">EVENTBRITE_API_KEY=your_key</code> to{" "}
              <code className="rounded bg-red-100 px-1">.env.local</code> and restart the dev server.
              Get a free key at eventbrite.com/platform → API Keys.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
