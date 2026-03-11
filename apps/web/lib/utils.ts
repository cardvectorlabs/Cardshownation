import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatShowDate(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  ) {
    // Same day
    return start.toLocaleDateString("en-US", opts);
  }

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    // Same month: "Apr 5–6, 2026"
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
  }

  // Different months
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", opts)}`;
}

export function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Converts a state 2-letter code to its slug
const STATE_SLUG_MAP: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas",
  CA: "california", CO: "colorado", CT: "connecticut", DE: "delaware",
  FL: "florida", GA: "georgia", HI: "hawaii", ID: "idaho",
  IL: "illinois", IN: "indiana", IA: "iowa", KS: "kansas",
  KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland",
  MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi",
  MO: "missouri", MT: "montana", NE: "nebraska", NV: "nevada",
  NH: "new-hampshire", NJ: "new-jersey", NM: "new-mexico", NY: "new-york",
  NC: "north-carolina", ND: "north-dakota", OH: "ohio", OK: "oklahoma",
  OR: "oregon", PA: "pennsylvania", RI: "rhode-island", SC: "south-carolina",
  SD: "south-dakota", TN: "tennessee", TX: "texas", UT: "utah",
  VT: "vermont", VA: "virginia", WA: "washington", WV: "west-virginia",
  WI: "wisconsin", WY: "wyoming",
};

export function stateCodeToSlug(code: string): string {
  return STATE_SLUG_MAP[code.toUpperCase()] ?? code.toLowerCase();
}

export function stateSlugToCode(slug: string): string | null {
  const entry = Object.entries(STATE_SLUG_MAP).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

// Returns "This Saturday", "This Sunday", "Apr 5", etc.
export function humanizeShowDate(startDate: Date): string {
  const now = new Date();
  const start = new Date(startDate);

  const diffDays = Math.round(
    (start.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) {
    const day = new Date(startDate).toLocaleDateString("en-US", { weekday: "long" });
    return `This ${day}`;
  }

  return new Date(startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function generateShowSlug(
  title: string,
  city: string,
  state: string,
  startDate: Date
): string {
  const date = new Date(startDate);
  const monthYear = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }).toLowerCase().replace(" ", "-");

  return `${slugify(title)}-${slugify(city)}-${state.toLowerCase()}-${monthYear}`;
}
