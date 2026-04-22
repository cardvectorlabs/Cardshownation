import { db } from "@/lib/db";
import { isFixtureMode } from "@/lib/data-mode";
import { getCityCoords } from "@/lib/city-coords";
import {
  approveFixtureSubmission,
  createFixtureSubmission,
  getFixtureSubmissionById,
  getFixtureSubmissions,
  rejectFixtureSubmission,
} from "@/lib/fixture-store";
import { slugify } from "@/lib/utils";
import { normalizeExternalUrl } from "@/lib/url";

function readString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readStringArray(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getApprovalLookup(payload: Record<string, unknown>) {
  const organizerId = readString(payload, "organizerId");
  const city = readString(payload, "city");
  const state = readString(payload, "state");

  if (!organizerId || !city || !state) {
    return null;
  }

  return {
    organizerId,
    city,
    state,
  };
}

async function bumpOrganizerApprovalCount(payload: Record<string, unknown>) {
  const lookup = getApprovalLookup(payload);
  if (!lookup) {
    return;
  }

  const approval = await db.organizerApproval.findUnique({
    where: {
      organizerId_city_state: {
        organizerId: lookup.organizerId,
        city: lookup.city,
        state: lookup.state,
      },
    },
  });

  if (!approval?.autoApprove) {
    return;
  }

  await db.organizerApproval.update({
    where: { id: approval.id },
    data: { approvedShowCount: { increment: 1 } },
  });
}

export async function createApprovedShowFromPayload(payload: Record<string, unknown>) {
  const organizerName = readString(payload, "organizerName");
  const organizerIdFromPayload = readString(payload, "organizerId");
  const venueName = readString(payload, "venueName");
  const venueAddress = readString(payload, "venueAddress");
  const city = readString(payload, "city") ?? "";
  const state = readString(payload, "state") ?? "";

  let organizerId: string | null = null;
  let venueId: string | null = null;

  if (organizerIdFromPayload) {
    const organizer = await db.organizer.findUnique({
      where: { id: organizerIdFromPayload },
    });
    organizerId = organizer?.id ?? null;
  }

  if (!organizerId && organizerName) {
    const existingOrganizer = await db.organizer.findFirst({
      where: { name: organizerName },
    });

    const organizer =
      existingOrganizer ??
      (await db.organizer.create({
        data: {
          name: organizerName,
          email: readString(payload, "organizerEmail"),
          websiteUrl: normalizeExternalUrl(readString(payload, "websiteUrl")),
          facebookUrl: normalizeExternalUrl(readString(payload, "facebookUrl")),
        },
      }));

    organizerId = organizer.id;
  }

  if (venueName && venueAddress) {
    const coords = getCityCoords(city, state);
    const venue = await db.venue.upsert({
      where: { name_city_state: { name: venueName, city, state } },
      create: {
        name: venueName,
        address1: venueAddress,
        city,
        state,
        parkingInfo: readString(payload, "parkingInfo"),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      },
      update: {},
    });

    venueId = venue.id;
  }

  const baseSlug = slugify(
    `${readString(payload, "showName") ?? "show"}-${city}-${state}`
  );

  let slug = baseSlug;
  let suffix = 2;

  while (await db.show.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return db.show.create({
    data: {
      title: readString(payload, "showName") ?? "Untitled Show",
      slug,
      city,
      state,
      startDate: new Date(
        readString(payload, "startDate") ?? new Date().toISOString()
      ),
      endDate: new Date(
        readString(payload, "endDate") ??
          readString(payload, "startDate") ??
          new Date().toISOString()
      ),
      startTimeLabel: readString(payload, "startTimeLabel"),
      endTimeLabel: readString(payload, "endTimeLabel"),
      categories: readStringArray(payload, "categories"),
      description: readString(payload, "description"),
      tableCount: Number.parseInt(readString(payload, "tableCount") ?? "", 10) || null,
      vendorDetails: readString(payload, "vendorDetails"),
      flyerImageUrl: readString(payload, "flyerImageUrl"),
      websiteUrl: normalizeExternalUrl(readString(payload, "websiteUrl")),
      facebookUrl: normalizeExternalUrl(readString(payload, "facebookUrl")),
      isFree: payload.isFree === true,
      admissionPrice: readString(payload, "admissionPrice"),
      admissionNotes: readString(payload, "admissionNotes"),
      parkingInfo: readString(payload, "parkingInfo"),
      status: "APPROVED",
      sourceType: "SUBMITTED",
      lastVerifiedAt: new Date(),
      expiresAt: new Date(
        new Date(
          readString(payload, "endDate") ?? new Date().toISOString()
        ).getTime() +
          24 * 60 * 60 * 1000
      ),
      organizerId,
      venueId,
    },
  });
}

export async function createShowSubmission(input: {
  submitterName: string;
  submitterEmail: string;
  payloadJson: Record<string, unknown>;
}) {
  if (isFixtureMode()) {
    return createFixtureSubmission(input);
  }

  return db.showSubmission.create({
    data: {
      submitterName: input.submitterName,
      submitterEmail: input.submitterEmail,
      payloadJson: input.payloadJson as object,
      status: "PENDING",
    },
  });
}

export async function getAllSubmissions() {
  if (isFixtureMode()) {
    return getFixtureSubmissions();
  }

  return db.showSubmission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPendingSubmissions() {
  if (isFixtureMode()) {
    return (await getFixtureSubmissions()).filter(
      (submission) => submission.status === "PENDING"
    );
  }

  return db.showSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
}

export async function getSubmissionById(id: string) {
  if (isFixtureMode()) {
    return getFixtureSubmissionById(id);
  }

  return db.showSubmission.findUnique({ where: { id } });
}

export async function approveShowSubmission(submissionId: string) {
  if (isFixtureMode()) {
    return approveFixtureSubmission(submissionId);
  }

  const submission = await db.showSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) return null;
  if (submission.status !== "PENDING") {
    return submission.reviewedShowId
      ? db.show.findUnique({ where: { id: submission.reviewedShowId } })
      : null;
  }

  const payload = submission.payloadJson as Record<string, unknown>;
  const show = await createApprovedShowFromPayload(payload);
  await bumpOrganizerApprovalCount(payload);

  await db.showSubmission.update({
    where: { id: submissionId },
    data: { status: "APPROVED", reviewedShowId: show.id },
  });

  return show;
}

export async function setOrganizerAutoApprovalForPayload(
  payload: Record<string, unknown>,
  enabled: boolean
) {
  const lookup = getApprovalLookup(payload);
  if (!lookup) {
    return null;
  }

  return db.organizerApproval.upsert({
    where: {
      organizerId_city_state: {
        organizerId: lookup.organizerId,
        city: lookup.city,
        state: lookup.state,
      },
    },
    create: {
      organizerId: lookup.organizerId,
      city: lookup.city,
      state: lookup.state,
      autoApprove: enabled,
    },
    update: {
      autoApprove: enabled,
    },
  });
}

export async function rejectShowSubmission(
  submissionId: string,
  notes: string | null
) {
  if (isFixtureMode()) {
    return rejectFixtureSubmission(submissionId, notes);
  }

  return db.showSubmission.update({
    where: { id: submissionId },
    data: { status: "REJECTED", notes },
  });
}
