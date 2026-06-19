"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicImportSource } from "@/lib/auto-import-sources";
import { createAutoImportSource, deleteAutoImportSource, triggerAutoImports, updateAutoImportSource } from "./actions";

type SourceSummary = {
  key: string;
  label: string;
  type: string;
  scheduleLabel: string;
  url: string;
  origin: "database" | "environment";
  active: boolean;
};

type RunSourceResult = {
  source: string;
  label: string;
  imported: number;
  skipped: number;
  errors: string[];
};

type RunResult = {
  sources: RunSourceResult[];
  imported: number;
  skipped: number;
  errors: string[];
};

type SourceData = {
  activeSources: SourceSummary[];
  managedSources: PublicImportSource[];
  environmentSources: PublicImportSource[];
};

type EditableSource = {
  name: string;
  url: string;
  city: string;
  state: string;
  organizerName: string;
  categories: string;
  facebookUrl: string;
  active: boolean;
};

function toEditableSource(source?: PublicImportSource): EditableSource {
  return {
    name: source?.name ?? "",
    url: source?.url ?? "",
    city: source?.city ?? "",
    state: source?.state ?? "",
    organizerName: source?.organizerName ?? "",
    categories: source?.categories?.join(", ") ?? "",
    facebookUrl: source?.facebookUrl ?? "",
    active: source?.active !== false,
  };
}

export function ImportsClient({ sources }: { sources: SourceData }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newSource, setNewSource] = useState<EditableSource>(toEditableSource());
  const [editing, setEditing] = useState<Record<string, EditableSource>>(
    Object.fromEntries(
      sources.managedSources
        .filter((source) => source.id)
        .map((source) => [source.id as string, toEditableSource(source)])
    )
  );

  async function triggerRun() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const data = await triggerAutoImports();
      setResult(data as RunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function handleCreateSource() {
    setSavingId("new");
    setFormError(null);
    try {
      const response = await createAutoImportSource({
        ...newSource,
        categories: newSource.categories,
      });
      if (!response.ok) {
        setFormError(response.error ?? "Unable to add source.");
        return;
      }
      setNewSource(toEditableSource());
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleUpdateSource(id: string) {
    const source = editing[id];
    if (!source) return;

    setSavingId(id);
    setFormError(null);
    try {
      const response = await updateAutoImportSource(id, {
        ...source,
        categories: source.categories,
      });
      if (!response.ok) {
        setFormError(response.error ?? "Unable to save source.");
        return;
      }
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteSource(id: string) {
    setSavingId(id);
    setFormError(null);
    try {
      await deleteAutoImportSource(id);
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Auto-Import</h1>
          <p className="mt-1 text-sm text-slate-500">
            Runs daily at 6 AM automatically via Vercel Cron. Imported shows land in{" "}
            <Link href="/admin/submissions" className="font-medium text-brand-600 hover:underline">
              Submissions
            </Link>{" "}
            as Pending for review before publishing.
          </p>
        </div>
        <button
          onClick={triggerRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {running ? "Running..." : "Run now"}
        </button>
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Sources</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {sources.activeSources.map((source) => (
            <div key={source.key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-slate-900">{source.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {source.type} import from public data only
                </p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                >
                  {source.url}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {source.origin === "database" ? "Portal" : "Env/API"}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Active
                </span>
                <span className="text-xs text-slate-400">{source.scheduleLabel}</span>
              </div>
            </div>
          ))}
          {sources.activeSources.length === 1 && (
            <div className="px-5 py-4 text-xs text-slate-500">
              Add <code className="rounded bg-slate-100 px-1">PUBLIC_SHOW_IMPORT_SOURCES_JSON</code>{" "}
              to import from public websites or public Facebook URLs.
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800">Public-source limits</p>
        <p className="mt-1 text-sm text-amber-700">
          Website and Facebook imports only use public pages that can be fetched without logging in.
          Private groups, member-only content, and pages that render data only after client-side login
          will not import reliably.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Manage Portal Sources</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add public website or Facebook URLs here instead of editing environment variables.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={newSource.name}
            onChange={(event) => setNewSource((current) => ({ ...current, name: event.target.value }))}
            placeholder="Source name"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newSource.url}
            onChange={(event) => setNewSource((current) => ({ ...current, url: event.target.value }))}
            placeholder="Public URL"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newSource.city}
            onChange={(event) => setNewSource((current) => ({ ...current, city: event.target.value }))}
            placeholder="Fallback city"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newSource.state}
            onChange={(event) => setNewSource((current) => ({ ...current, state: event.target.value }))}
            placeholder="Fallback state"
            maxLength={2}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newSource.organizerName}
            onChange={(event) => setNewSource((current) => ({ ...current, organizerName: event.target.value }))}
            placeholder="Organizer name"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newSource.facebookUrl}
            onChange={(event) => setNewSource((current) => ({ ...current, facebookUrl: event.target.value }))}
            placeholder="Canonical Facebook URL (optional)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={newSource.categories}
            onChange={(event) => setNewSource((current) => ({ ...current, categories: event.target.value }))}
            placeholder="Categories, comma-separated"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={newSource.active}
            onChange={(event) => setNewSource((current) => ({ ...current, active: event.target.checked }))}
          />
          Active
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCreateSource}
            disabled={savingId === "new"}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingId === "new" ? "Saving..." : "Add source"}
          </button>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Portal Sources</h2>
        {sources.managedSources.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No portal-managed sources yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {sources.managedSources.map((source) => {
              const id = source.id as string;
              const current = editing[id] ?? toEditableSource(source);
              return (
                <div key={id} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={current.name}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, name: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={current.url}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, url: event.target.value },
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={current.city}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, city: event.target.value },
                        }))
                      }
                      placeholder="Fallback city"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={current.state}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, state: event.target.value },
                        }))
                      }
                      maxLength={2}
                      placeholder="Fallback state"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={current.organizerName}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, organizerName: event.target.value },
                        }))
                      }
                      placeholder="Organizer name"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={current.facebookUrl}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, facebookUrl: event.target.value },
                        }))
                      }
                      placeholder="Canonical Facebook URL"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={current.categories}
                      onChange={(event) =>
                        setEditing((existing) => ({
                          ...existing,
                          [id]: { ...current, categories: event.target.value },
                        }))
                      }
                      placeholder="Categories, comma-separated"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={current.active}
                        onChange={(event) =>
                          setEditing((existing) => ({
                            ...existing,
                            [id]: { ...current, active: event.target.checked },
                          }))
                        }
                      />
                      Active
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateSource(id)}
                        disabled={savingId === id}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {savingId === id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSource(id)}
                        disabled={savingId === id}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sources.environmentSources.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Environment Sources</h2>
          <p className="mt-1 text-sm text-slate-500">
            These still come from <code className="rounded bg-white px-1">PUBLIC_SHOW_IMPORT_SOURCES_JSON</code>.
            If the same URL exists in the portal, the portal version wins.
          </p>
          <div className="mt-4 space-y-2">
            {sources.environmentSources.map((source) => (
              <div key={source.url} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="font-medium text-slate-900">{source.name}</div>
                <div className="text-slate-500">{source.url}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_100px_100px_100px] bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Source</span>
              <span className="text-center">Imported</span>
              <span className="text-center">Skipped</span>
              <span className="text-center">Errors</span>
            </div>
            <div className="divide-y divide-slate-100">
              {result.sources.map((source) => (
                <div
                  key={source.source}
                  className="grid grid-cols-[minmax(0,1fr)_100px_100px_100px] items-center px-4 py-3 text-sm text-slate-700"
                >
                  <span>{source.label}</span>
                  <span className="text-center font-medium text-green-700">{source.imported}</span>
                  <span className="text-center">{source.skipped}</span>
                  <span className="text-center text-red-600">{source.errors.length}</span>
                </div>
              ))}
            </div>
          </div>
          {result.imported > 0 && (
            <div className="mt-4">
              <Link
                href="/admin/submissions"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                Review new submissions
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
              Get a free key at eventbrite.com/platform.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
