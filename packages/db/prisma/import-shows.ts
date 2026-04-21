import { PrismaClient } from "../generated/prisma-client";
import { readFileSync } from "fs";
import { join } from "path";

const STATE_MAP: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(s: string): string {
  return s.replace(/﻿/g, "").trim();
}

function parseDate(s: string): Date | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const [m, d, y] = trimmed.split("/").map((x) => parseInt(x, 10));
  if (!m || !d || !y || m > 12 || d > 31) return null;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

async function main() {
  const db = new PrismaClient();
  const csvPath = join(__dirname, "import-data/shows.csv");
  const csvText = readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c && c.trim()));
  rows.shift(); // header

  console.log(`Parsed ${rows.length} rows from CSV`);

  console.log("Wiping existing show/venue/organizer data...");
  await db.showTag.deleteMany({});
  await db.showReport.deleteMany({});
  await db.savedShow.deleteMany({});
  await db.show.deleteMany({});
  await db.venue.deleteMany({});
  await db.organizer.deleteMany({});

  let imported = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];
  const seenSlugs = new Set<string>();
  const dedupeKeys = new Set<string>();

  for (const cols of rows) {
    const [
      _timestamp, email, showName, startDateStr, endDateStr,
      city, stateName, venueName, tableCountStr, hostName,
      contact, _consent, websiteExtra,
    ] = cols.map((c) => cleanText(c ?? ""));

    if (!showName || !startDateStr || !city || !stateName) {
      skipped++; skippedReasons.push(`missing core fields: ${showName || "(no name)"}`); continue;
    }

    const stateCode = STATE_MAP[stateName.toLowerCase().trim()];
    if (!stateCode) {
      skipped++; skippedReasons.push(`unknown state: ${stateName} | ${showName}`); continue;
    }

    const startDate = parseDate(startDateStr);
    if (!startDate) {
      skipped++; skippedReasons.push(`bad start date: ${startDateStr} | ${showName}`); continue;
    }

    let endDate = parseDate(endDateStr) ?? startDate;
    if (endDate.getTime() < startDate.getTime()) endDate = startDate;
    // Card shows are rarely > 5 days — treat as data error
    if (endDate.getTime() - startDate.getTime() > 5 * 24 * 60 * 60 * 1000) {
      endDate = startDate;
    }

    // Dedupe on normalized title + date + city + state
    const normTitle = showName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normVenue = (venueName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const dedupeKey = `${normTitle}|${startDate.toISOString().slice(0, 10)}|${city.toLowerCase().trim()}|${stateCode}`;
    const venueDedupeKey = normVenue ? `${normVenue}|${startDate.toISOString().slice(0, 10)}|${city.toLowerCase().trim()}|${stateCode}` : null;
    if (dedupeKeys.has(dedupeKey) || (venueDedupeKey && dedupeKeys.has(venueDedupeKey))) {
      skipped++; skippedReasons.push(`dupe: ${showName} | ${startDateStr} | ${city}`); continue;
    }
    dedupeKeys.add(dedupeKey);
    if (venueDedupeKey) dedupeKeys.add(venueDedupeKey);

    const baseSlug = slugify(`${showName}-${city}-${stateCode}-${startDate.toISOString().slice(0, 10)}`);
    let slug = baseSlug;
    let suffix = 2;
    while (seenSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
    seenSlugs.add(slug);

    // Venue (dedupe on name+city+state)
    let venueId: string | null = null;
    if (venueName) {
      const venue = await db.venue.upsert({
        where: { name_city_state: { name: venueName, city, state: stateCode } },
        update: {},
        create: {
          name: venueName, address1: "TBD",
          city, state: stateCode,
        },
      });
      venueId = venue.id;
    }

    // Organizer (dedupe on name)
    let organizerId: string | null = null;
    if (hostName) {
      let organizer = await db.organizer.findFirst({ where: { name: hostName } });
      if (!organizer) {
        const websiteUrl = websiteExtra && websiteExtra.startsWith("http") ? websiteExtra
          : (contact && contact.startsWith("http") && !contact.includes("facebook") ? contact : null);
        const facebookUrl = contact && contact.includes("facebook") ? contact.split(/\s+/).find((t) => t.includes("facebook")) ?? null : null;
        organizer = await db.organizer.create({
          data: {
            name: hostName,
            email: email && email.includes("@") ? email : null,
            websiteUrl,
            facebookUrl,
          },
        });
      }
      organizerId = organizer.id;
    }

    const tableCount = tableCountStr ? parseInt(tableCountStr.replace(/[^\d]/g, ""), 10) || null : null;
    const sourceType = email ? "SUBMITTED" : "IMPORTED";

    await db.show.create({
      data: {
        title: showName,
        slug,
        status: "APPROVED",
        sourceType,
        timezone: "America/Chicago",
        startDate, endDate,
        city, state: stateCode,
        tableCount,
        categories: [],
        venueId, organizerId,
        lastVerifiedAt: new Date(),
        websiteUrl: websiteExtra && websiteExtra.startsWith("http") ? websiteExtra : null,
      },
    });
    imported++;
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped:  ${skipped}`);
  if (skipped > 0) {
    console.log(`\nSkipped reasons:`);
    skippedReasons.slice(0, 30).forEach((r) => console.log(`  - ${r}`));
    if (skippedReasons.length > 30) console.log(`  ... and ${skippedReasons.length - 30} more`);
  }

  console.log(`\nFinal counts:`);
  console.log(`  Shows:      ${await db.show.count()}`);
  console.log(`  Venues:     ${await db.venue.count()}`);
  console.log(`  Organizers: ${await db.organizer.count()}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
