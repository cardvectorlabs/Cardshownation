"use client";

import { useRef, useState } from "react";
import { Upload, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { importShows, type ImportRow, type ImportResult } from "./actions";

const HEADERS: (keyof ImportRow)[] = [
  "title",
  "startDate",
  "endDate",
  "startTimeLabel",
  "endTimeLabel",
  "city",
  "state",
  "venueName",
  "venueAddress",
  "isFree",
  "admissionPrice",
  "admissionNotes",
  "categories",
  "description",
  "websiteUrl",
  "facebookUrl",
  "tableCount",
  "vendorDetails",
];

const TEMPLATE_ROW: ImportRow = {
  title: "Olathe Sports Collectibles Show",
  startDate: "2026-04-18",
  endDate: "2026-04-18",
  startTimeLabel: "9:00 AM",
  endTimeLabel: "5:00 PM",
  city: "Olathe",
  state: "KS",
  venueName: "Hampton Inn Olathe",
  venueAddress: "125 W 151st St",
  isFree: "false",
  admissionPrice: "$5",
  admissionNotes: "Kids 12 and under free",
  categories: "Sports Cards,Pokemon",
  description: "",
  websiteUrl: "",
  facebookUrl: "",
  tableCount: "",
  vendorDetails: "",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        current.push(field);
        field = "";
      } else if (char === "\r" && next === "\n") {
        current.push(field);
        field = "";
        if (current.some((f) => f.trim())) rows.push(current);
        current = [];
        i++;
      } else if (char === "\n" || char === "\r") {
        current.push(field);
        field = "";
        if (current.some((f) => f.trim())) rows.push(current);
        current = [];
      } else {
        field += char;
      }
    }
  }

  if (field || current.length > 0) {
    current.push(field);
    if (current.some((f) => f.trim())) rows.push(current);
  }

  return rows;
}

function downloadTemplate() {
  const header = HEADERS.join(",");
  const example = HEADERS.map((h) => {
    const val = TEMPLATE_ROW[h];
    return val.includes(",") ? `"${val}"` : val;
  }).join(",");
  const csv = `${header}\n${example}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "card-shows-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setParseError(null);
    setRows([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const allRows = parseCsv(text);

      if (allRows.length < 2) {
        setParseError("CSV must have a header row and at least one data row.");
        return;
      }

      const rawHeaders = allRows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
      const headerMap: Record<string, number> = {};

      const aliases: Record<string, string> = {
        startdate: "startDate",
        enddate: "endDate",
        starttimeLabel: "startTimeLabel",
        starttimeLabelabel: "startTimeLabel",
        endtimelabel: "endTimeLabel",
        venuename: "venueName",
        venueaddress: "venueAddress",
        isfree: "isFree",
        admissionprice: "admissionPrice",
        admissionnotes: "admissionNotes",
        websiteurl: "websiteUrl",
        facebookurl: "facebookUrl",
        tablecount: "tableCount",
        vendordetails: "vendorDetails",
      };

      rawHeaders.forEach((h, i) => {
        const normalized = aliases[h] ?? h;
        headerMap[normalized] = i;
      });

      const missing = HEADERS.filter(
        (h) => headerMap[h] === undefined && h !== "description"
      );
      if (missing.length > 0) {
        // Only hard-fail on truly required cols
        const required = ["title", "startDate", "city", "state"];
        const missingRequired = missing.filter((h) => required.includes(h));
        if (missingRequired.length > 0) {
          setParseError(`Missing required columns: ${missingRequired.join(", ")}`);
          return;
        }
      }

      const parsed: ImportRow[] = allRows.slice(1).map((cols) => {
        const get = (key: keyof ImportRow) =>
          headerMap[key] !== undefined ? (cols[headerMap[key]] ?? "").trim() : "";
        return {
          title: get("title"),
          startDate: get("startDate"),
          endDate: get("endDate"),
          startTimeLabel: get("startTimeLabel"),
          endTimeLabel: get("endTimeLabel"),
          city: get("city"),
          state: get("state"),
          venueName: get("venueName"),
          venueAddress: get("venueAddress"),
          isFree: get("isFree"),
          admissionPrice: get("admissionPrice"),
          admissionNotes: get("admissionNotes"),
          categories: get("categories"),
          description: get("description"),
          websiteUrl: get("websiteUrl"),
          facebookUrl: get("facebookUrl"),
          tableCount: get("tableCount"),
          vendorDetails: get("vendorDetails"),
        };
      });

      setRows(parsed);
    };

    reader.readAsText(file);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await importShows(rows);
      setResult(res);
      if (res.errors.length === 0) {
        setRows([]);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload area */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upload CSV</h2>
            <p className="mt-1 text-sm text-slate-500">
              Required columns: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">title, startDate, endDate, city, state</code>.
              Download the template for all supported columns.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Template
          </button>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            Click to select a CSV file
          </span>
          <span className="text-xs text-slate-400">or drag and drop</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFile}
          />
        </label>

        {parseError && (
          <p className="mt-3 text-sm text-red-600">{parseError}</p>
        )}
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Preview — {rows.length} row{rows.length === 1 ? "" : "s"}
              </h2>
              <p className="text-sm text-slate-500">
                Existing shows (matched by slug) will be updated.
              </p>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Importing…" : `Import ${rows.length} shows`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">City, State</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Admission</th>
                  <th className="px-4 py-3">Categories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-400">{i + 2}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {row.title || <span className="text-red-500">missing</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                      {row.startDate}
                      {row.startDate !== row.endDate && row.endDate ? ` → ${row.endDate}` : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                      {row.city || <span className="text-red-500">missing</span>}
                      {row.state ? `, ${row.state}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.venueName}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                      {row.isFree === "true" || row.isFree === "yes" || row.isFree === "1"
                        ? "Free"
                        : row.admissionPrice || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{row.categories}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="px-4 py-3 text-xs text-slate-400">
                Showing first 50 of {rows.length} rows. All rows will be imported.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Import complete</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-700">{result.imported} imported</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-blue-700">{result.updated} updated</span>
            </div>
            {result.errors.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-red-700">{result.errors.length} errors</span>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                Rows with errors
              </p>
              <ul className="space-y-1">
                {result.errors.map((e) => (
                  <li key={e.row} className="text-sm text-red-700">
                    <span className="font-medium">Row {e.row}:</span> {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
