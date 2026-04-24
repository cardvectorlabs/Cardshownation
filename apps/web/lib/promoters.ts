import { db } from "@/lib/db";
import { isFixtureMode } from "@/lib/data-mode";
import { saveFlyerImage } from "@/lib/flyers";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { createApprovedShowFromPayload, createShowSubmission } from "@/lib/submissions";
import { normalizeExternalUrl } from "@/lib/url";

type RegisterPromoterInput = {
  email: string;
  password: string;
  contactName: string;
  organizerName: string;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
};

type PromoterShowInput = {
  showName: string;
  startDate: string;
  endDate: string;
  startTimeLabel?: string | null;
  endTimeLabel?: string | null;
  city: string;
  state: string;
  venueName: string;
  venueAddress?: string | null;
  categories: string[];
  description?: string | null;
  tableCount?: string | null;
  vendorDetails?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  isFree: boolean;
  admissionPrice?: string | null;
  admissionNotes?: string | null;
  parkingInfo?: string | null;
  flyerFile?: File | null;
};

export type PromoterShowDefaults = {
  showName: string;
  startDate: string;
  endDate: string;
  startTimeLabel: string | null;
  endTimeLabel: string | null;
  city: string;
  state: string;
  venueName: string;
  venueAddress: string | null;
  categories: string[];
  description: string | null;
  tableCount: string | null;
  vendorDetails: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  isFree: boolean;
  admissionPrice: string | null;
  admissionNotes: string | null;
  parkingInfo: string | null;
};

function normalizeLocationValue(value: string) {
  return value.trim();
}

export async function registerPromoterAccount(input: RegisterPromoterInput) {
  const email = input.email.trim().toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("An account already exists for that email.");
  }

  const passwordHash = await hashPassword(input.password);

  // If an organizer record already exists for this email (e.g. created from a
  // show submission), link the new user to it rather than creating a duplicate.
  const existingOrganizer = await db.organizer.findFirst({
    where: { email, userId: null },
  });

  if (existingOrganizer) {
    const user = await db.user.create({
      data: {
        name: input.contactName,
        email,
        passwordHash,
        role: "ORGANIZER",
      },
    });
    await db.organizer.update({
      where: { id: existingOrganizer.id },
      data: {
        userId: user.id,
        name: input.organizerName,
        websiteUrl: normalizeExternalUrl(input.websiteUrl),
        facebookUrl: normalizeExternalUrl(input.facebookUrl),
        instagramUrl: normalizeExternalUrl(input.instagramUrl),
      },
    });
    return user;
  }

  const user = await db.user.create({
    data: {
      name: input.contactName,
      email,
      passwordHash,
      role: "ORGANIZER",
      organizer: {
        create: {
          name: input.organizerName,
          email,
          websiteUrl: normalizeExternalUrl(input.websiteUrl),
          facebookUrl: normalizeExternalUrl(input.facebookUrl),
          instagramUrl: normalizeExternalUrl(input.instagramUrl),
        },
      },
    },
  });

  return user;
}

export async function authenticatePromoter(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    include: { organizer: true },
  });

  if (!user?.organizer || user.role !== "ORGANIZER") {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

export async function getPromoterDashboardData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      organizer: {
        include: {
          approvals: {
            where: { autoApprove: true },
            orderBy: [{ state: "asc" }, { city: "asc" }],
          },
          shows: {
            orderBy: [{ startDate: "desc" }],
            take: 20,
          },
        },
      },
    },
  });

  if (!user?.organizer) {
    return null;
  }

  const showCount = await db.show.count({
    where: { organizerId: user.organizer.id },
  });

  return {
    user,
    organizer: user.organizer,
    approvals: user.organizer.approvals,
    shows: user.organizer.shows,
    showCount,
  };
}

export async function getPromoterShowDefaults(userId: string, showId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { organizer: true },
  });

  if (!user?.organizer) {
    return null;
  }

  const show = await db.show.findFirst({
    where: {
      id: showId,
      organizerId: user.organizer.id,
    },
    include: {
      venue: true,
    },
  });

  if (!show) {
    return null;
  }

  return {
    showName: show.title,
    startDate: show.startDate.toISOString().slice(0, 10),
    endDate: show.endDate.toISOString().slice(0, 10),
    startTimeLabel: show.startTimeLabel,
    endTimeLabel: show.endTimeLabel,
    city: show.city,
    state: show.state,
    venueName: show.venue?.name ?? "",
    venueAddress: show.venue?.address1 ?? null,
    categories: show.categories,
    description: show.description,
    tableCount: show.tableCount?.toString() ?? null,
    vendorDetails: show.vendorDetails,
    websiteUrl: show.websiteUrl,
    facebookUrl: show.facebookUrl,
    isFree: show.isFree,
    admissionPrice: show.admissionPrice,
    admissionNotes: show.admissionNotes,
    parkingInfo: show.parkingInfo,
  } satisfies PromoterShowDefaults;
}

export async function createPromoterShow(userId: string, input: PromoterShowInput) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { organizer: true },
  });

  if (!user?.organizer) {
    throw new Error("Organizer account not found.");
  }

  const organizer = user.organizer;
  const city = normalizeLocationValue(input.city);
  const state = normalizeLocationValue(input.state).toUpperCase();
  const flyerImageUrl =
    input.flyerFile && input.flyerFile.size > 0
      ? await saveFlyerImage(input.showName, input.flyerFile)
      : null;

  const payload: Record<string, unknown> = {
    showName: input.showName,
    startDate: input.startDate,
    endDate: input.endDate,
    startTimeLabel: input.startTimeLabel ?? null,
    endTimeLabel: input.endTimeLabel ?? null,
    city,
    state,
    venueName: input.venueName,
    venueAddress: input.venueAddress ?? null,
    categories: input.categories,
    organizerId: organizer.id,
    organizerName: organizer.name,
    organizerEmail: organizer.email,
    description: input.description ?? null,
    tableCount: input.tableCount ?? null,
    vendorDetails: input.vendorDetails ?? null,
    websiteUrl: normalizeExternalUrl(input.websiteUrl) ?? organizer.websiteUrl,
    facebookUrl: normalizeExternalUrl(input.facebookUrl) ?? organizer.facebookUrl,
    isFree: input.isFree,
    admissionPrice: input.admissionPrice ?? null,
    admissionNotes: input.admissionNotes ?? null,
    parkingInfo: input.parkingInfo ?? null,
    flyerImageUrl,
    submittedViaPortal: true,
  };

  const approval = await db.organizerApproval.findUnique({
    where: {
      organizerId_city_state: {
        organizerId: organizer.id,
        city,
        state,
      },
    },
  });

  const nextApprovedCount = (approval?.approvedShowCount ?? 0) + 1;
  const needsSpotCheck =
    Boolean(approval?.autoApprove) &&
    nextApprovedCount % Math.max(approval?.reviewEvery ?? 4, 1) === 0;

  if (approval?.autoApprove && !needsSpotCheck) {
    const show = await createApprovedShowFromPayload(payload);
    await db.organizerApproval.update({
      where: { id: approval.id },
      data: { approvedShowCount: { increment: 1 } },
    });

    return {
      status: "APPROVED" as const,
      show,
      territoryStatus: "trusted",
    };
  }

  const submission = await createShowSubmission({
    submitterName: user.name ?? organizer.name,
    submitterEmail: user.email,
    payloadJson: payload,
  });

  return {
    status: "PENDING" as const,
    submission,
    territoryStatus: approval?.autoApprove ? "spot-check" : "review",
  };
}

export async function getAdminPromoters() {
  if (isFixtureMode()) {
    return [];
  }

  return db.organizer.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      approvals: {
        orderBy: [{ state: "asc" }, { city: "asc" }],
      },
      _count: {
        select: {
          shows: true,
        },
      },
    },
    orderBy: [{ verified: "desc" }, { name: "asc" }],
  });
}

export async function getAdminPromoterById(organizerId: string) {
  if (isFixtureMode()) {
    return null;
  }

  return db.organizer.findUnique({
    where: { id: organizerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          emailVerifiedAt: true,
        },
      },
      approvals: {
        orderBy: [{ state: "asc" }, { city: "asc" }],
      },
      shows: {
        orderBy: [{ startDate: "desc" }],
        take: 20,
        select: {
          id: true,
          title: true,
          slug: true,
          city: true,
          state: true,
          status: true,
          startDate: true,
          endDate: true,
          lastVerifiedAt: true,
        },
      },
      _count: {
        select: {
          shows: true,
        },
      },
    },
  });
}

export async function cleanupPromoterTestData() {
  const testUsers = await db.user.findMany({
    where: {
      email: {
        startsWith: "portal-test-",
      },
    },
    select: {
      id: true,
      email: true,
      organizer: {
        select: {
          id: true,
        },
      },
    },
  });

  const organizerIds = testUsers
    .map((user) => user.organizer?.id ?? null)
    .filter((id): id is string => Boolean(id));
  const emails = testUsers.map((user) => user.email);

  if (organizerIds.length > 0) {
    await db.organizerApproval.deleteMany({
      where: {
        organizerId: { in: organizerIds },
      },
    });

    await db.show.deleteMany({
      where: {
        organizerId: { in: organizerIds },
      },
    });

    await db.organizer.deleteMany({
      where: {
        id: { in: organizerIds },
      },
    });
  }

  if (emails.length > 0) {
    const deletedSubmissions = await db.showSubmission.deleteMany({
      where: {
        submitterEmail: { in: emails },
      },
    });

    const deletedUsers = await db.user.deleteMany({
      where: {
        id: { in: testUsers.map((user) => user.id) },
      },
    });

    const deletedVenues = await db.venue.deleteMany({
      where: {
        OR: [
          { name: { startsWith: "Test Venue " } },
          { address1: { startsWith: "123 Test" } },
          { address1: { startsWith: "456 Test" } },
        ],
      },
    });

    return {
      deletedUsers: deletedUsers.count,
      deletedOrganizers: organizerIds.length,
      deletedVenues: deletedVenues.count,
      deletedSubmissions: deletedSubmissions.count,
    };
  }

  return {
    deletedUsers: 0,
    deletedOrganizers: organizerIds.length,
    deletedVenues: 0,
    deletedSubmissions: 0,
  };
}
