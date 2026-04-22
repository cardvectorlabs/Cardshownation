import { Prisma } from "@csn/db";
import { db } from "@/lib/db";
import { isFixtureMode } from "@/lib/data-mode";
import { getCityCoords } from "@/lib/city-coords";
import type { FixtureShow } from "@/lib/fixture-data";
import {
  getAllFixtureShows,
  getFixtureShowById,
  getFixtureShowBySlug,
} from "@/lib/fixture-store";

export const SHOW_CATEGORIES = [
  "Sports Cards",
  "Pokemon",
  "TCG",
  "Mixed",
  "Memorabilia",
  "Comics",
  "Trade Night",
  "Autograph Guests",
] as const;

const showCardSelect = {
  id: true,
  title: true,
  slug: true,
  city: true,
  state: true,
  startDate: true,
  endDate: true,
  startTimeLabel: true,
  endTimeLabel: true,
  isFree: true,
  admissionPrice: true,
  categories: true,
  flyerImageUrl: true,
  tableCount: true,
  vendorDetails: true,
  featuredRank: true,
  venue: { select: { name: true } },
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function upcomingWhere() {
  const today = startOfToday();

  return {
    status: "APPROVED" as const,
    startDate: { gte: today },
    OR: [{ expiresAt: null }, { expiresAt: { gte: today } }],
  };
}

function compareKansasPriority(aState: string, bState: string) {
  if (aState === "KS" && bState !== "KS") {
    return -1;
  }

  if (aState !== "KS" && bState === "KS") {
    return 1;
  }

  return aState.localeCompare(bState);
}

function sortShows(
  a: { featuredRank: number | null; startDate: Date; state: string; city: string; title: string },
  b: { featuredRank: number | null; startDate: Date; state: string; city: string; title: string }
) {
  const featuredA = a.featuredRank ?? Number.POSITIVE_INFINITY;
  const featuredB = b.featuredRank ?? Number.POSITIVE_INFINITY;

  if (featuredA !== featuredB) {
    return featuredA - featuredB;
  }

  const startDateDiff = a.startDate.getTime() - b.startDate.getTime();
  if (startDateDiff !== 0) {
    return startDateDiff;
  }

  const stateDiff = compareKansasPriority(a.state, b.state);
  if (stateDiff !== 0) {
    return stateDiff;
  }

  const cityDiff = a.city.localeCompare(b.city);
  if (cityDiff !== 0) {
    return cityDiff;
  }

  return a.title.localeCompare(b.title);
}

function isUpcomingFixtureShow(show: FixtureShow) {
  const today = startOfToday();
  return (
    show.status === "APPROVED" &&
    show.startDate >= today &&
    (!show.expiresAt || show.expiresAt >= today)
  );
}

function projectShowCard(show: FixtureShow) {
  return {
    id: show.id,
    title: show.title,
    slug: show.slug,
    city: show.city,
    state: show.state,
    startDate: show.startDate,
    endDate: show.endDate,
    startTimeLabel: show.startTimeLabel,
    endTimeLabel: show.endTimeLabel,
    isFree: show.isFree,
    admissionPrice: show.admissionPrice,
    categories: show.categories,
    flyerImageUrl: show.flyerImageUrl,
    tableCount: show.tableCount,
    vendorDetails: show.vendorDetails,
    featuredRank: show.featuredRank,
    venue: show.venue ? { name: show.venue.name } : null,
  };
}

async function filterFixtureShows({
  state,
  city,
  category,
  isFree,
  q,
}: {
  state?: string;
  city?: string;
  category?: string;
  isFree?: boolean;
  q?: string;
}) {
  const shows = await getAllFixtureShows();
  const normalizedQuery = q?.trim().toLowerCase();

  return shows.filter((show) => {
    if (!isUpcomingFixtureShow(show)) return false;
    if (state && show.state !== state) return false;
    if (city && !show.city.toLowerCase().includes(city.toLowerCase())) return false;
    if (category && !show.categories.includes(category)) return false;
    if (isFree !== undefined && show.isFree !== isFree) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      show.title,
      show.city,
      show.description ?? "",
      show.venue?.name ?? "",
      show.organizer?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export async function getFeaturedShows(limit = 6) {
  if (isFixtureMode()) {
    const shows = (await filterFixtureShows({}))
      .filter((show) => show.featuredRank !== null)
      .sort(sortShows)
      .slice(0, limit)
      .map(projectShowCard);

    return shows;
  }

  return db.show.findMany({
    where: {
      ...upcomingWhere(),
      featuredRank: { not: null },
    },
    orderBy: [{ featuredRank: "asc" }, { startDate: "asc" }],
    take: limit,
    select: showCardSelect,
  });
}

export async function getUpcomingShows({
  state,
  city,
  category,
  isFree,
  q,
  limit = 24,
  offset = 0,
}: {
  state?: string;
  city?: string;
  category?: string;
  isFree?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  if (isFixtureMode()) {
    const filteredShows = (await filterFixtureShows({
      state,
      city,
      category,
      isFree,
      q,
    })).sort(sortShows);

    return {
      shows: filteredShows.slice(offset, offset + limit).map(projectShowCard),
      total: filteredShows.length,
    };
  }

  const today = startOfToday();
  const where: any = upcomingWhere();
  const clauses: Prisma.Sql[] = [
    Prisma.sql`s.status = 'APPROVED'`,
    Prisma.sql`s."startDate" >= ${today}`,
    Prisma.sql`(s."expiresAt" IS NULL OR s."expiresAt" >= ${today})`,
  ];

  if (state) {
    where.state = state;
    clauses.push(Prisma.sql`s.state = ${state}`);
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
    clauses.push(Prisma.sql`s.city ILIKE ${`%${city}%`}`);
  }

  if (category) {
    where.categories = { has: category };
    clauses.push(Prisma.sql`${category} = ANY(s.categories)`);
  }

  if (isFree !== undefined) {
    where.isFree = isFree;
    clauses.push(Prisma.sql`s."isFree" = ${isFree}`);
  }

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { venue: { is: { name: { contains: q, mode: "insensitive" } } } },
          { organizer: { is: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ];

    const pattern = `%${q}%`;
    clauses.push(Prisma.sql`(
      s.title ILIKE ${pattern}
      OR s.city ILIKE ${pattern}
      OR COALESCE(s.description, '') ILIKE ${pattern}
      OR COALESCE(v.name, '') ILIKE ${pattern}
      OR COALESCE(o.name, '') ILIKE ${pattern}
    )`);
  }

  type UpcomingRow = {
    id: string;
    title: string;
    slug: string;
    city: string;
    state: string;
    startDate: Date;
    endDate: Date;
    startTimeLabel: string | null;
    endTimeLabel: string | null;
    isFree: boolean;
    admissionPrice: string | null;
    categories: string[];
    flyerImageUrl: string | null;
    tableCount: number | null;
    vendorDetails: string | null;
    featuredRank: number | null;
    venueName: string | null;
  };

  const [shows, total] = await Promise.all([
    db.$queryRaw<UpcomingRow[]>(Prisma.sql`
      SELECT
        s.id,
        s.title,
        s.slug,
        s.city,
        s.state,
        s."startDate",
        s."endDate",
        s."startTimeLabel",
        s."endTimeLabel",
        s."isFree",
        s."admissionPrice",
        s.categories,
        s."flyerImageUrl",
        s."tableCount",
        s."vendorDetails",
        s."featuredRank",
        v.name AS "venueName"
      FROM "Show" s
      LEFT JOIN "Venue" v ON v.id = s."venueId"
      LEFT JOIN "Organizer" o ON o.id = s."organizerId"
      WHERE ${Prisma.join(clauses, Prisma.sql` AND `)}
      ORDER BY
        COALESCE(s."featuredRank", 2147483647) ASC,
        s."startDate" ASC,
        CASE WHEN s.state = 'KS' THEN 0 ELSE 1 END ASC,
        s.state ASC,
        s.city ASC,
        s.title ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        city: row.city,
        state: row.state,
        startDate: row.startDate,
        endDate: row.endDate,
        startTimeLabel: row.startTimeLabel,
        endTimeLabel: row.endTimeLabel,
        isFree: row.isFree,
        admissionPrice: row.admissionPrice,
        categories: row.categories,
        flyerImageUrl: row.flyerImageUrl,
        tableCount: row.tableCount,
        vendorDetails: row.vendorDetails,
        featuredRank: row.featuredRank,
        venue: row.venueName ? { name: row.venueName } : null,
      }))
    ),
    db.show.count({ where }),
  ]);

  return { shows, total };
}

export async function getShowsByState(stateCode: string, limit = 24) {
  if (isFixtureMode()) {
    return (await filterFixtureShows({ state: stateCode }))
      .sort(sortShows)
      .slice(0, limit)
      .map(projectShowCard);
  }

  return db.show.findMany({
    where: {
      ...upcomingWhere(),
      state: stateCode,
    },
    orderBy: [{ featuredRank: "asc" }, { startDate: "asc" }],
    take: limit,
    select: showCardSelect,
  });
}

export async function getShowsByCity(
  stateCode: string,
  city: string,
  limit = 24
) {
  if (isFixtureMode()) {
    return (await filterFixtureShows({ state: stateCode, city }))
      .filter((show) => show.city.toLowerCase() === city.toLowerCase())
      .sort(sortShows)
      .slice(0, limit)
      .map(projectShowCard);
  }

  return db.show.findMany({
    where: {
      ...upcomingWhere(),
      state: stateCode,
      city: { equals: city, mode: "insensitive" },
    },
    orderBy: [{ featuredRank: "asc" }, { startDate: "asc" }],
    take: limit,
    select: showCardSelect,
  });
}

export async function getShowBySlug(slug: string) {
  if (isFixtureMode()) {
    return getFixtureShowBySlug(slug);
  }

  return db.show.findUnique({
    where: { slug },
    include: {
      venue: true,
      organizer: true,
      tags: true,
    },
  });
}

export async function getCitiesWithShows(stateCode: string) {
  if (isFixtureMode()) {
    const cityCounts = new Map<string, number>();

    (await filterFixtureShows({ state: stateCode })).forEach((show) => {
      cityCounts.set(show.city, (cityCounts.get(show.city) ?? 0) + 1);
    });

    return [...cityCounts.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  }

  const results = await db.show.groupBy({
    by: ["city"],
    where: {
      ...upcomingWhere(),
      state: stateCode,
    },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
  });

  return results.map((result) => ({
    city: result.city,
    count: result._count.city,
  }));
}

export async function getStatesWithShows() {
  if (isFixtureMode()) {
    const stateCounts = new Map<string, number>();

    (await filterFixtureShows({})).forEach((show) => {
      stateCounts.set(show.state, (stateCounts.get(show.state) ?? 0) + 1);
    });

    return [...stateCounts.entries()]
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state));
  }

  const results = await db.show.groupBy({
    by: ["state"],
    where: upcomingWhere(),
    _count: { state: true },
    orderBy: { _count: { state: "desc" } },
  });

  return results.map((result) => ({
    state: result.state,
    count: result._count.state,
  }));
}

export async function getHomepageDirectoryStats() {
  if (isFixtureMode()) {
    const shows = await filterFixtureShows({});
    const states = new Set(shows.map((show) => show.state));
    const organizers = new Set(
      shows
        .map((show) => show.organizer?.name ?? null)
        .filter((organizer): organizer is string => Boolean(organizer))
    );

    return {
      upcomingShows: shows.length,
      activeStates: states.size,
      activeOrganizers: organizers.size,
    };
  }

  const [upcomingShows, activeStates, activeOrganizers] = await Promise.all([
    db.show.count({ where: upcomingWhere() }),
    db.show
      .groupBy({
        by: ["state"],
        where: upcomingWhere(),
      })
      .then((states) => states.length),
    db.organizer.count({
      where: {
        shows: {
          some: upcomingWhere(),
        },
      },
    }),
  ]);

  return {
    upcomingShows,
    activeStates,
    activeOrganizers,
  };
}

export async function getAdminShowStats() {
  const staleDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  if (isFixtureMode()) {
    const shows = await getAllFixtureShows();

    return {
      pending: shows.filter((show) => show.status === "PENDING").length,
      approved: shows.filter((show) => show.status === "APPROVED").length,
      rejected: shows.filter((show) => show.status === "REJECTED").length,
      stale: shows.filter(
        (show) =>
          show.status === "APPROVED" &&
          (!show.lastVerifiedAt || show.lastVerifiedAt < staleDate)
      ).length,
    };
  }

  const [pending, approved, rejected, stale] = await Promise.all([
    db.show.count({ where: { status: "PENDING" } }),
    db.show.count({ where: { status: "APPROVED" } }),
    db.show.count({ where: { status: "REJECTED" } }),
    db.show.count({
      where: {
        status: "APPROVED",
        OR: [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: staleDate } }],
      },
    }),
  ]);

  return { pending, approved, rejected, stale };
}

export async function getRecentAdminShows(limit = 10) {
  if (isFixtureMode()) {
    return (await getAllFixtureShows())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  return db.show.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      status: true,
      city: true,
      state: true,
      startDate: true,
      endDate: true,
      lastVerifiedAt: true,
      createdAt: true,
    },
  });
}

export async function getAdminShows({
  status,
  stale,
  limit = 30,
  offset = 0,
}: {
  status?: string;
  stale?: boolean;
  limit?: number;
  offset?: number;
}) {
  const staleDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  if (isFixtureMode()) {
    let shows = await getAllFixtureShows();

    if (status) {
      shows = shows.filter((show) => show.status === status);
    }

    if (stale) {
      shows = shows.filter(
        (show) =>
          show.status === "APPROVED" &&
          (!show.lastVerifiedAt || show.lastVerifiedAt < staleDate)
      );
    }

    shows = shows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      shows: shows.slice(offset, offset + limit),
      total: shows.length,
    };
  }

  const where: any = {};
  if (status) where.status = status;
  if (stale) {
    where.status = "APPROVED";
    where.OR = [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: staleDate } }];
  }

  const [shows, total] = await Promise.all([
    db.show.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        status: true,
        city: true,
        state: true,
        startDate: true,
        endDate: true,
        lastVerifiedAt: true,
        slug: true,
        sourceType: true,
      },
    }),
    db.show.count({ where }),
  ]);

  return { shows, total };
}

export async function getNearbyShows({
  lat,
  lng,
  radiusMiles = 100,
  limit = 48,
}: {
  lat: number;
  lng: number;
  radiusMiles?: number;
  limit?: number;
}) {
  if (isFixtureMode()) {
    return (await filterFixtureShows({}))
      .sort(sortShows)
      .slice(0, limit)
      .map(projectShowCard);
  }

  const today = startOfToday();

  type NearbyRow = {
    id: string;
    title: string;
    slug: string;
    city: string;
    state: string;
    startDate: Date;
    endDate: Date;
    startTimeLabel: string | null;
    endTimeLabel: string | null;
    isFree: boolean;
    admissionPrice: string | null;
    categories: string[];
    flyerImageUrl: string | null;
    tableCount: bigint | null;
    vendorDetails: string | null;
    featuredRank: bigint | null;
    venueName: string | null;
    distanceMiles: unknown;
  };

  const rows = await db.$queryRaw<NearbyRow[]>`
    SELECT
      s.id,
      s.title,
      s.slug,
      s.city,
      s.state,
      s."startDate",
      s."endDate",
      s."startTimeLabel",
      s."endTimeLabel",
      s."isFree",
      s."admissionPrice",
      s.categories,
      s."flyerImageUrl",
      s."tableCount",
      s."vendorDetails",
      s."featuredRank",
      v.name AS "venueName",
      ROUND(
        (3959.0 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(${lat})) * cos(radians(v.latitude)) *
            cos(radians(v.longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(v.latitude))
          ))
        ))::numeric, 1
      ) AS "distanceMiles"
    FROM "Show" s
    JOIN "Venue" v ON s."venueId" = v.id
    WHERE s.status = 'APPROVED'
      AND s."startDate" >= ${today}
      AND (s."expiresAt" IS NULL OR s."expiresAt" >= ${today})
      AND v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND (3959.0 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${lat})) * cos(radians(v.latitude)) *
          cos(radians(v.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(v.latitude))
        ))
      )) <= ${radiusMiles}
    ORDER BY
      COALESCE(s."featuredRank", 2147483647) ASC,
      s."startDate" ASC,
      CASE WHEN s.state = 'KS' THEN 0 ELSE 1 END ASC,
      s.state ASC,
      s.city ASC,
      s.title ASC
    LIMIT ${limit}
  `;

  const venueResults = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    city: row.city,
    state: row.state,
    startDate: row.startDate,
    endDate: row.endDate,
    startTimeLabel: row.startTimeLabel,
    endTimeLabel: row.endTimeLabel,
    isFree: row.isFree,
    admissionPrice: row.admissionPrice,
    categories: row.categories,
    flyerImageUrl: row.flyerImageUrl,
    tableCount: row.tableCount !== null ? Number(row.tableCount) : null,
    vendorDetails: row.vendorDetails,
    featuredRank: row.featuredRank !== null ? Number(row.featuredRank) : null,
    venue: row.venueName ? { name: row.venueName } : null,
    distanceMiles: parseFloat(String(row.distanceMiles)),
  }));

  // Fallback: shows without venue coords — use city-level coordinates
  const venueResultIds = new Set(venueResults.map((s) => s.id));

  const noCoordShows = await db.show.findMany({
    where: {
      ...upcomingWhere(),
      OR: [
        { venueId: null },
        { venue: { latitude: null } },
        { venue: { longitude: null } },
      ],
    },
    select: { ...showCardSelect, id: true },
  });

  function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const cityFallback = noCoordShows
    .filter((s) => !venueResultIds.has(s.id))
    .flatMap((s) => {
      const coords = getCityCoords(s.city, s.state);
      if (!coords) return [];
      const dist = haversine(lat, lng, coords.lat, coords.lng);
      if (dist > radiusMiles) return [];
      return [{ ...s, distanceMiles: Math.round(dist * 10) / 10 }];
    });

  return [...venueResults, ...cityFallback]
    .sort(sortShows)
    .slice(0, limit);
}

export async function getAdminShowById(id: string) {
  if (isFixtureMode()) {
    return getFixtureShowById(id);
  }

  return db.show.findUnique({
    where: { id },
    include: { venue: true, organizer: true, tags: true },
  });
}
