import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isFixtureMode } from "@/lib/data-mode";
import {
  approveFixtureSubmission,
  createFixtureSubmission,
  getFixtureSubmissionById,
  getFixtureSubmissions,
  rejectFixtureSubmission,
} from "@/lib/fixture-store";
import { slugify } from "@/lib/utils";

function readString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readStringArray(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
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
      payloadJson: input.payloadJson as Prisma.InputJsonObject,
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

  const payload = submission.payloadJson as Record<string, unknown>;
  const organizerName = readString(payload, "organizerName");
  const venueName = readString(payload, "venueName");
  const venueAddress = readString(payload, "venueAddress");
  const city = readString(payload, "city") ?? "";
  const state = readString(payload, "state") ?? "";

  let organizerId: string | null = null;
  let venueId: string | null = null;

  if (organizerName) {
    const existingOrganizer = await db.organizer.findFirst({
      where: { name: organizerName },
    });

    const organizer =
      existingOrganizer ??
      (await db.organizer.create({
        data: {
          name: organizerName,
          email: readString(payload, "organizerEmail"),
          websiteUrl: readString(payload, "websiteUrl"),
          facebookUrl: readString(payload, "facebookUrl"),
        },
      }));

    organizerId = organizer.id;
  }

  if (venueName && venueAddress) {
    const existingVenue = await db.venue.findFirst({
      where: {
        name: venueName,
        address1: venueAddress,
        city,
        state,
      },
    });

    const venue =
      existingVenue ??
      (await db.venue.create({
        data: {
          name: venueName,
          address1: venueAddress,
          city,
          state,
          parkingInfo: readString(payload, "parkingInfo"),
        },
      }));

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

  const show = await db.show.create({
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
      websiteUrl: readString(payload, "websiteUrl"),
      facebookUrl: readString(payload, "facebookUrl"),
      isFree: payload.isFree === true,
      admissionPrice: readString(payload, "admissionPrice"),
      admissionNotes: readString(payload, "admissionNotes"),
      parkingInfo: readString(payload, "parkingInfo"),
      status: "APPROVED",
      sourceType: "SUBMITTED",
      lastVerifiedAt: new Date(),
      organizerId,
      venueId,
    },
  });

  await db.showSubmission.update({
    where: { id: submissionId },
    data: { status: "APPROVED", reviewedShowId: show.id },
  });

  return show;
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
