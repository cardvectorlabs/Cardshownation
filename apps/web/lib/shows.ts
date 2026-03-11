import { db } from "@/lib/db";

export const SHOW_CATEGORIES = [
  "Sports Cards",
  "Pokémon",
  "TCG",
  "Mixed",
  "Memorabilia",
  "Comics",
  "Trade Night",
  "Autograph Guests",
] as const;

// Fields returned on show cards (list views)
const showCardSelect = {
  id: true,
  title: true,
  slug: true,
  city: true,
  state: true,
  startDate: true,
  endDate: true,
  startTimeLabel: true,
  isFree: true,
  admissionPrice: true,
  categories: true,
  flyerImageUrl: true,
  tableCount: true,
  featuredRank: true,
  venue: { select: { name: true } },
};

// ─── Public queries ───────────────────────────────────────────────────────────

export async function getThisWeekendShows(limit = 6) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat

  // Find upcoming Saturday (or today if it's already the weekend)
  const daysToSat = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysToSat);
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + (day === 0 ? 0 : 1));
  sunday.setHours(23, 59, 59, 999);

  return db.show.findMany({
    where: {
      status: "APPROVED",
      startDate: { gte: saturday, lte: sunday },
    },
    orderBy: [{ featuredRank: "asc" }, { startDate: "asc" }],
    take: limit,
    select: showCardSelect,
  });
}

export async function getRecentlyAddedShows(limit = 6) {
  return db.show.findMany({
    where: {
      status: "APPROVED",
      startDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
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
  const where: any = {
    status: "APPROVED",
    startDate: { gte: new Date() },
  };

  if (state) where.state = state;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (category) where.categories = { has: category };
  if (isFree !== undefined) where.isFree = isFree;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [shows, total] = await Promise.all([
    db.show.findMany({
      where,
      orderBy: [{ featuredRank: "asc" }, { startDate: "asc" }],
      take: limit,
      skip: offset,
      select: showCardSelect,
    }),
    db.show.count({ where }),
  ]);

  return { shows, total };
}

export async function getShowsByState(stateCode: string, limit = 24) {
  return db.show.findMany({
    where: {
      state: stateCode,
      status: "APPROVED",
      startDate: { gte: new Date() },
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
  return db.show.findMany({
    where: {
      state: stateCode,
      city: { equals: city, mode: "insensitive" },
      status: "APPROVED",
      startDate: { gte: new Date() },
    },
    orderBy: [{ featuredRank: "asc" }, { startDate: "asc" }],
    take: limit,
    select: showCardSelect,
  });
}

export async function getShowBySlug(slug: string) {
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
  const results = await db.show.groupBy({
    by: ["city"],
    where: {
      state: stateCode,
      status: "APPROVED",
      startDate: { gte: new Date() },
    },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
  });

  return results.map((r: any) => ({ city: r.city, count: r._count.city }));
}

export async function getStatesWithShows() {
  const results = await db.show.groupBy({
    by: ["state"],
    where: {
      status: "APPROVED",
      startDate: { gte: new Date() },
    },
    _count: { state: true },
    orderBy: { _count: { state: "desc" } },
  });

  return results.map((r: any) => ({ state: r.state, count: r._count.state }));
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function getAdminShowStats() {
  const staleDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [pending, approved, rejected, stale] = await Promise.all([
    db.show.count({ where: { status: "PENDING" } }),
    db.show.count({ where: { status: "APPROVED" } }),
    db.show.count({ where: { status: "REJECTED" } }),
    db.show.count({
      where: {
        status: "APPROVED",
        OR: [
          { lastVerifiedAt: null },
          { lastVerifiedAt: { lt: staleDate } },
        ],
      },
    }),
  ]);

  return { pending, approved, rejected, stale };
}

export async function getPendingSubmissions() {
  return db.showSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
}
