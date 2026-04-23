"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FileUp, Loader2 } from "lucide-react";
import { uploadShowsCsvAction, type UploadState } from "./actions";

const initialState: UploadState = {
  created: 0,
  skipped: 0,
  errors: [],
  message: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
      {pending ? "Uploading..." : "Upload CSV"}
    </button>
  );
}

export function UploadForm() {
  const [state, action] = useActionState(uploadShowsCsvAction, initialState);

  return (
    <div className="space-y-6">
      <form action={action} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-950">Bulk show upload</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Upload a CSV with one row per show. Rows missing required values will be skipped and listed below.
        </p>

        <div className="mt-6">
          <label
            htmlFor="file"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            CSV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-xs leading-5 text-slate-500">
            Required columns: <span className="font-medium">title, startDate, endDate, city, state</span>.
          </p>
          <SubmitButton />
        </div>
      </form>

      {state.message && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-950">Results</h2>
          <p className="mt-2 text-sm text-slate-600">{state.message}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <StatCard label="Created" value={String(state.created)} />
            <StatCard label="Skipped" value={String(state.skipped)} />
            <StatCard label="Errors" value={String(state.errors.length)} />
          </div>

          {state.errors.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.errors.map((error) => (
                    <tr key={`${error.row}-${error.message}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{error.row}</td>
                      <td className="px-4 py-3 text-slate-600">{error.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

