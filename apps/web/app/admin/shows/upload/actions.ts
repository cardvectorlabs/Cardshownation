"use server";

import Papa from "papaparse";
import { requireAdminSession } from "@/lib/admin-auth";
import { bulkCreateShows, type ParsedShowRow } from "@/lib/shows";

export type UploadState = {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  message: string | null;
};

const initialState: UploadState = {
  created: 0,
  skipped: 0,
  errors: [],
  message: null,
};
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1000;

type CsvRow = Omit<ParsedShowRow, "rowNumber">;

export async function uploadShowsCsvAction(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const session = await requireAdminSession("/admin/shows/upload");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ...initialState,
      message: "Choose a CSV file before uploading.",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ...initialState,
      message: "CSV file is too large. Keep uploads under 2 MB.",
    };
  }

  const csvText = await file.text();
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    return {
      ...initialState,
      message: parsed.errors[0]?.message ?? "Could not parse the CSV file.",
    };
  }

  const rows = parsed.data
    .map((row, index) => ({
      rowNumber: index + 2,
      ...row,
    }))
    .filter((row) => !String(row.title ?? "").trim().toUpperCase().startsWith("EXAMPLE"));

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      ...initialState,
      message: "CSV file has too many rows. Split imports into batches of 1,000 rows or fewer.",
    };
  }

  if (rows.length === 0) {
    return {
      ...initialState,
      message: "No importable rows were found in that CSV file.",
    };
  }

  try {
    const result = await bulkCreateShows(rows, {
      actorId: session.user.id,
      actorRole: "ADMIN",
    });
    return {
      ...result,
      message: `Import finished. Created ${result.created} show${result.created === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return {
      ...initialState,
      message:
        error instanceof Error
          ? error.message
          : "The upload failed before any shows were created.",
    };
  }
}
