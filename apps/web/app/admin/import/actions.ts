"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getCityCoords } from "@/lib/city-coords";
import { normalizeExternalUrl } from "@/lib/url";

export type ImportRow = {
  title: string;
  startDate: string;
  endDate: string;
  startTimeLabel: string;
  endTimeLabel: string;
  city: string;
  state: string;
  venueName: string;
  venueAddress: string;
  isFree: string;
  admissionPrice: string;
  admissionNotes: string;
  categories: string;
  description: string;
  websiteUrl: string;
  facebookUrl: string;
  tableCount: string;
  vendorDetails: string;
};

export type ImportResult = {
  imported: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
};

function parseDate(val: string): Date | null {
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T12:00:00`);
    if (!isNaN(d.getTime())) return d;
  }

  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const iso = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}T12:00:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function generateSlug(title: string, city: string, startDate: Date): string {
  const base = [title, city]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const month = String(startDate.getMonth() + 1).padStart(2, "0");
  const day = String(startDate.getDate()).padStart(2, "0");
  const year = startDate.getFullYear();
  return `${base}-${month}-${day}-${year}`;
}

function parseBool(val: string): boolean {
  return ["true", "yes", "1"].includes(val.trim().toLowerCase());
}

type ParsedRow = {
  rowNum: number;
  slug: string;
  data: {
    title: string;
    slug: string;
    description: string | null;
    status: "APPROVED";
    sourceType: "IMPORTED";
    timezone: string;
    startDate: Date;
    endDate: Date;
    startTimeLabel: string | null;
    endTimeLabel: string | null;
    city: string;
    state: string;
    isFree: boolean;
    admissionPrice: string | null;
    admissionNotes: string | null;
    tableCount: number | null;
    vendorDetails: string | null;
    websiteUrl: string | null;
    facebookUrl: string | null;
    categories: string[];
    lastVerifiedAt: Date;
    expiresAt: Date;
    venueKey: string | null; // temp key for venue lookup
  };
};

export async function importShows(rows: ImportRow[]): Promise<ImportResult> {
  await requireAdminSession("/admin/import");

  const errors: Array<{ row: number; message: string }> = [];
  if (rows.length > 500) {
    return {
      imported: 0,
      updated: 0,
      errors: [{ row: 1, message: "Import limited to 500 rows per run." }],
    };
  }

  const now = new Date();

  // 1. Parse and validate all rows up front
  type IntermediateRow = ParsedRow & { venueKey: string | null };
  const parsed: IntermediateRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      if (!row.title.trim()) throw new Error("title is required");
      if (!row.city.trim()) throw new Error("city is required");
      if (!row.state.trim()) throw new Error("state is required");

      const startDate = parseDate(row.startDate);
      if (!startDate) throw new Error(`invalid startDate "${row.startDate}" — use YYYY-MM-DD or M/D/YYYY`);

      const endDate = parseDate(row.endDate) ?? startDate;
      const isFree = parseBool(row.isFree);
      const categories = row.categories.split(",").map((c) => c.trim()).filter(Boolean);
      const websiteUrl = normalizeExternalUrl(row.websiteUrl.trim());
      const facebookUrl = normalizeExternalUrl(row.facebookUrl.trim());
      if (row.websiteUrl.trim() && !websiteUrl) {
        throw new Error(`invalid websiteUrl "${row.websiteUrl}"`);
      }
      if (row.facebookUrl.trim() && !facebookUrl) {
        throw new Error(`invalid facebookUrl "${row.facebookUrl}"`);
      }
      const slug = generateSlug(row.title.trim(), row.city.trim(), startDate);
      const state = row.state.trim().toUpperCase();
      const city = row.city.trim();
      const venueKey = row.venueName.trim()
        ? `${row.venueName.trim().toLowerCase()}|${city.toLowerCase()}|${state}`
        : null;

      parsed.push({
        rowNum,
        slug,
        venueKey,
        data: {
          title: row.title.trim(),
          slug,
          description: row.description.trim() || null,
          status: "APPROVED",
          sourceType: "IMPORTED",
          timezone: "America/Chicago",
          startDate,
          endDate,
          startTimeLabel: row.startTimeLabel.trim() || null,
          endTimeLabel: row.endTimeLabel.trim() || null,
          city,
          state,
          isFree,
          admissionPrice: isFree ? null : row.admissionPrice.trim() || null,
          admissionNotes: row.admissionNotes.trim() || null,
          tableCount: row.tableCount.trim() ? parseInt(row.tableCount, 10) : null,
          vendorDetails: row.vendorDetails.trim() || null,
          websiteUrl,
          facebookUrl,
          categories,
          lastVerifiedAt: now,
          expiresAt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
          venueKey,
        },
      });
    } catch (err) {
      errors.push({ row: rowNum, message: err instanceof Error ? err.message : String(err) });
    }
  }

  // 2. Batch-fetch all needed venues in one query
  const uniqueVenueKeys = [...new Set(parsed.map((r) => r.venueKey).filter(Boolean))] as string[];
  const venueKeyMap = new Map<string, string>(); // venueKey -> venueId

  if (uniqueVenueKeys.length > 0) {
    const venueNames = uniqueVenueKeys.map((k) => k.split("|")[0]);
    const existingVenues = await db.venue.findMany({
      where: { name: { in: venueNames, mode: "insensitive" } },
      select: { id: true, name: true, city: true, state: true },
    });

    for (const v of existingVenues) {
      const key = `${v.name.toLowerCase()}|${v.city.toLowerCase()}|${v.state}`;
      venueKeyMap.set(key, v.id);
    }

    // Create missing venues in parallel
    const missingKeys = uniqueVenueKeys.filter((k) => !venueKeyMap.has(k));
    if (missingKeys.length > 0) {
      const created = await Promise.all(
        missingKeys.map((key) => {
          const [name, city, state] = key.split("|");
          const originalRow = rows.find(
            (r) =>
              r.venueName.trim().toLowerCase() === name &&
              r.city.trim().toLowerCase() === city &&
              r.state.trim().toUpperCase() === state.toUpperCase()
          );
          const venueCity = originalRow?.city.trim() ?? city;
          const venueState = state.toUpperCase();
          const coords = getCityCoords(venueCity, venueState);
          const venueName = originalRow?.venueName.trim() ?? name;
          return db.venue.upsert({
            where: { name_city_state: { name: venueName, city: venueCity, state: venueState } },
            create: {
              name: venueName,
              address1: originalRow?.venueAddress.trim() || venueName,
              city: venueCity,
              state: venueState,
              latitude: coords?.lat ?? null,
              longitude: coords?.lng ?? null,
            },
            update: {},
            select: { id: true, name: true, city: true, state: true },
          });
        })
      );
      for (const v of created) {
        const key = `${v.name.toLowerCase()}|${v.city.toLowerCase()}|${v.state}`;
        venueKeyMap.set(key, v.id);
      }
    }
  }

  // 3. Batch-fetch existing shows by slug
  const allSlugs = parsed.map((r) => r.slug);
  const existingSlugs = new Set(
    (await db.show.findMany({ where: { slug: { in: allSlugs } }, select: { slug: true } }))
      .map((s: { slug: string }) => s.slug)
  );

  // 4. Split into creates and updates
  const toCreate: any[] = [];
  const toUpdate: { slug: string; data: any }[] = [];

  for (const row of parsed) {
    const venueId = row.venueKey ? (venueKeyMap.get(row.venueKey) ?? null) : null;
    const { venueKey: _vk, ...dataWithoutVenueKey } = row.data;
    const finalData = { ...dataWithoutVenueKey, venueId };

    if (existingSlugs.has(row.slug)) {
      toUpdate.push({ slug: row.slug, data: finalData });
    } else {
      toCreate.push(finalData);
    }
  }

  // 5. Batch create + parallel updates
  let imported = 0;
  let updated = 0;

  if (toCreate.length > 0) {
    const result = await db.show.createMany({ data: toCreate, skipDuplicates: true });
    imported = result.count;
  }

  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map(({ slug, data }) => db.show.update({ where: { slug }, data }))
    );
    updated = toUpdate.length;
  }

  return { imported, updated, errors };
}
