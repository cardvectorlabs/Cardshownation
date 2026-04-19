import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getStateByCode } from "@/lib/states";
import { slugify } from "@/lib/utils";
import { isFixtureMode } from "@/lib/data-mode";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://cardshownation.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/card-shows`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/submit-show`, priority: 0.6, changeFrequency: "monthly" },
  ];

  if (isFixtureMode()) return staticPages;

  const today = new Date();

  // All active shows
  const shows = await db.show.findMany({
    where: {
      status: "APPROVED",
      endDate: { gte: today },
    },
    select: { slug: true, updatedAt: true },
  });

  const showPages: MetadataRoute.Sitemap = shows.map((show) => ({
    url: `${BASE_URL}/shows/${show.slug}`,
    lastModified: show.updatedAt,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  // State pages
  const stateResults = await db.show.groupBy({
    by: ["state"],
    where: { status: "APPROVED", endDate: { gte: today } },
    _count: { state: true },
  });

  const statePages: MetadataRoute.Sitemap = stateResults.flatMap(({ state }) => {
    const record = getStateByCode(state);
    if (!record) return [];
    return [{
      url: `${BASE_URL}/card-shows/${record.slug}`,
      priority: 0.8,
      changeFrequency: "daily" as const,
    }];
  });

  // City pages
  const cityResults = await db.show.groupBy({
    by: ["city", "state"],
    where: { status: "APPROVED", endDate: { gte: today } },
    _count: { city: true },
  });

  const cityPages: MetadataRoute.Sitemap = cityResults.flatMap(({ city, state }) => {
    const record = getStateByCode(state);
    if (!record) return [];
    return [{
      url: `${BASE_URL}/card-shows/${record.slug}/${slugify(city)}`,
      priority: 0.7,
      changeFrequency: "weekly" as const,
    }];
  });

  return [...staticPages, ...statePages, ...cityPages, ...showPages];
}
