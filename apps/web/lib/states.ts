export type DirectoryState = {
  code: string;
  name: string;
  slug: string;
  launchPriority: "core" | "extended" | "national";
  seoBlurb?: string;
};

export const US_STATES: DirectoryState[] = [
  { code: "AL", name: "Alabama", slug: "alabama", launchPriority: "national" },
  { code: "AK", name: "Alaska", slug: "alaska", launchPriority: "national" },
  { code: "AZ", name: "Arizona", slug: "arizona", launchPriority: "national" },
  { code: "AR", name: "Arkansas", slug: "arkansas", launchPriority: "extended" },
  { code: "CA", name: "California", slug: "california", launchPriority: "national" },
  {
    code: "CO",
    name: "Colorado",
    slug: "colorado",
    launchPriority: "extended",
    seoBlurb:
      "Colorado collectors regularly travel between Denver, Colorado Springs, and the Front Range for sports card and TCG weekends. Browse upcoming shows with event details in one place.",
  },
  { code: "CT", name: "Connecticut", slug: "connecticut", launchPriority: "national" },
  { code: "DE", name: "Delaware", slug: "delaware", launchPriority: "national" },
  { code: "FL", name: "Florida", slug: "florida", launchPriority: "national" },
  { code: "GA", name: "Georgia", slug: "georgia", launchPriority: "national" },
  { code: "HI", name: "Hawaii", slug: "hawaii", launchPriority: "national" },
  { code: "ID", name: "Idaho", slug: "idaho", launchPriority: "national" },
  {
    code: "IL",
    name: "Illinois",
    slug: "illinois",
    launchPriority: "core",
    seoBlurb:
      "Illinois card shows draw collectors from Chicago, the suburbs, and across the Midwest. Find upcoming sports card, Pokemon, and TCG events with dates, venues, and admission details.",
  },
  { code: "IN", name: "Indiana", slug: "indiana", launchPriority: "national" },
  {
    code: "IA",
    name: "Iowa",
    slug: "iowa",
    launchPriority: "core",
    seoBlurb:
      "Iowa card shows give collectors a dependable way to plan quick weekend trips across Des Moines, Cedar Rapids, and the rest of the state. Browse upcoming sports card and TCG events here.",
  },
  {
    code: "KS",
    name: "Kansas",
    slug: "kansas",
    launchPriority: "core",
    seoBlurb:
      "Kansas card shows are a core part of the launch footprint for Card Show Nation. Browse upcoming shows in Wichita, Overland Park, and across the state with venue, admission, and vendor details.",
  },
  { code: "KY", name: "Kentucky", slug: "kentucky", launchPriority: "national" },
  { code: "LA", name: "Louisiana", slug: "louisiana", launchPriority: "national" },
  { code: "ME", name: "Maine", slug: "maine", launchPriority: "national" },
  { code: "MD", name: "Maryland", slug: "maryland", launchPriority: "national" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts", launchPriority: "national" },
  { code: "MI", name: "Michigan", slug: "michigan", launchPriority: "national" },
  { code: "MN", name: "Minnesota", slug: "minnesota", launchPriority: "extended" },
  { code: "MS", name: "Mississippi", slug: "mississippi", launchPriority: "national" },
  {
    code: "MO",
    name: "Missouri",
    slug: "missouri",
    launchPriority: "core",
    seoBlurb:
      "Missouri is one of the strongest early markets for Card Show Nation, with collectors moving between Kansas City, St. Louis, and regional weekend shows. Explore current listings and promoter details.",
  },
  { code: "MT", name: "Montana", slug: "montana", launchPriority: "national" },
  {
    code: "NE",
    name: "Nebraska",
    slug: "nebraska",
    launchPriority: "core",
    seoBlurb:
      "Nebraska card shows offer a practical regional trip for collectors across Omaha, Lincoln, and neighboring states. Browse upcoming events with venue, admission, and table info.",
  },
  { code: "NV", name: "Nevada", slug: "nevada", launchPriority: "national" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire", launchPriority: "national" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey", launchPriority: "national" },
  { code: "NM", name: "New Mexico", slug: "new-mexico", launchPriority: "national" },
  { code: "NY", name: "New York", slug: "new-york", launchPriority: "national" },
  { code: "NC", name: "North Carolina", slug: "north-carolina", launchPriority: "national" },
  { code: "ND", name: "North Dakota", slug: "north-dakota", launchPriority: "national" },
  { code: "OH", name: "Ohio", slug: "ohio", launchPriority: "national" },
  {
    code: "OK",
    name: "Oklahoma",
    slug: "oklahoma",
    launchPriority: "core",
    seoBlurb:
      "Oklahoma collectors can use Card Show Nation to quickly find shows in Oklahoma City, Tulsa, and nearby regional markets. Browse dates, venues, and vendor details for upcoming weekends.",
  },
  { code: "OR", name: "Oregon", slug: "oregon", launchPriority: "national" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania", launchPriority: "national" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island", launchPriority: "national" },
  { code: "SC", name: "South Carolina", slug: "south-carolina", launchPriority: "national" },
  { code: "SD", name: "South Dakota", slug: "south-dakota", launchPriority: "national" },
  { code: "TN", name: "Tennessee", slug: "tennessee", launchPriority: "national" },
  {
    code: "TX",
    name: "Texas",
    slug: "texas",
    launchPriority: "extended",
    seoBlurb:
      "Texas remains a strong expansion market for Card Show Nation. Browse upcoming sports card and TCG events by city, venue, and date as the directory grows.",
  },
  { code: "UT", name: "Utah", slug: "utah", launchPriority: "national" },
  { code: "VT", name: "Vermont", slug: "vermont", launchPriority: "national" },
  { code: "VA", name: "Virginia", slug: "virginia", launchPriority: "national" },
  { code: "WA", name: "Washington", slug: "washington", launchPriority: "national" },
  { code: "WV", name: "West Virginia", slug: "west-virginia", launchPriority: "national" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin", launchPriority: "extended" },
  { code: "WY", name: "Wyoming", slug: "wyoming", launchPriority: "national" },
];

export const CORE_MARKET_CODES = ["KS", "MO", "OK", "NE", "IA", "IL"] as const;
export const HOMEPAGE_STATE_CODES = [
  "KS",
  "MO",
  "OK",
  "NE",
  "IA",
  "IL",
  "TX",
  "CO",
] as const;

export function getStateByCode(code?: string | null) {
  if (!code) return null;
  return US_STATES.find((state) => state.code === code.toUpperCase()) ?? null;
}

export function getStateBySlug(slug?: string | null) {
  if (!slug) return null;
  return US_STATES.find((state) => state.slug === slug.toLowerCase()) ?? null;
}

export function getStatesByCodes(codes: readonly string[]) {
  return codes
    .map((code) => getStateByCode(code))
    .filter((state): state is DirectoryState => Boolean(state));
}
