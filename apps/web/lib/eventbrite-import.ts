import { db } from "@/lib/db";
import { fetchCardShowsFromEventbrite } from "@/lib/eventbrite";
import { getCityCoords } from "@/lib/city-coords";
import { slugify } from "@/lib/utils";
import { normalizeExternalUrl } from "@/lib/url";

export async function runEventbriteImport() {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) return { error: "EVENTBRITE_API_KEY not set" };

  const shows = await fetchCardShowsFromEventbrite(apiKey);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const show of shows) {
    try {
      const existing = await db.showSubmission.findFirst({
        where: { payloadJson: { path: ["externalId"], equals: show.externalId } },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const duplicate = await db.show.findFirst({
        where: {
          title: { equals: show.title, mode: "insensitive" },
          city: { equals: show.city, mode: "insensitive" },
          state: show.state,
          startDate: show.startDate,
        },
      });
      if (duplicate) {
        skipped++;
        continue;
      }

      let venueId: string | null = null;
      if (show.venueName && show.venueAddress) {
        const coords = show.venueLat && show.venueLng
          ? { lat: show.venueLat, lng: show.venueLng }
          : getCityCoords(show.city, show.state);

        const venue = await db.venue.upsert({
          where: { name_city_state: { name: show.venueName, city: show.city, state: show.state } },
          create: {
            name: show.venueName,
            address1: show.venueAddress,
            city: show.city,
            state: show.state,
            latitude: coords?.lat ?? null,
            longitude: coords?.lng ?? null,
          },
          update: {},
        });
        venueId = venue.id;
      }

      const baseSlug = slugify(`${show.title}-${show.city}-${show.state}`);
      let slug = baseSlug;
      let suffix = 2;
      while (await db.show.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      await db.showSubmission.create({
        data: {
          submitterName: "Eventbrite Import",
          submitterEmail: "import@cardshownation.com",
          status: "PENDING",
          payloadJson: {
            externalId: show.externalId,
            showName: show.title,
            description: show.description,
            startDate: show.startDate.toISOString().split("T")[0],
            endDate: show.endDate.toISOString().split("T")[0],
            city: show.city,
            state: show.state,
            venueName: show.venueName ?? "",
            venueAddress: show.venueAddress ?? "",
            categories: show.categories,
            isFree: show.isFree,
            admissionPrice: show.admissionPrice ?? "",
            websiteUrl: normalizeExternalUrl(show.websiteUrl),
            organizerName: show.organizerName ?? "",
            organizerEmail: "",
            source: "eventbrite",
            venueId,
            slug,
          },
        },
      });

      imported++;
    } catch (err) {
      errors.push(`${show.title}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await db.importLog.create({
    data: {
      source: "eventbrite",
      imported,
      skipped,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  return { imported, skipped, errors };
}
