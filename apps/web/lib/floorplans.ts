import type { Prisma } from "@csn/db";
import { db } from "@/lib/db";
import type { DocumentSlice } from "@floorplanner/lib/persistence";

export type ShowFloorplanSummary = {
  id: string;
  name: string;
  savedAt: string;
  revision: number;
  tableCount: number;
  vendorCount: number;
};

export type ShowFloorplanRecord = ShowFloorplanSummary & {
  data: DocumentSlice;
};

export class ShowFloorplanRevisionConflictError extends Error {
  currentLayout: ShowFloorplanSummary | null;

  constructor(message: string, currentLayout: ShowFloorplanSummary | null) {
    super(message);
    this.name = "ShowFloorplanRevisionConflictError";
    this.currentLayout = currentLayout;
  }
}

function toSummary(row: {
  id: string;
  name: string;
  updatedAt: Date;
  revision: number;
  tableCount: number;
  vendorCount: number;
}): ShowFloorplanSummary {
  return {
    id: row.id,
    name: row.name,
    savedAt: row.updatedAt.toISOString(),
    revision: row.revision,
    tableCount: row.tableCount,
    vendorCount: row.vendorCount,
  };
}

export async function listShowFloorplans(showId: string): Promise<ShowFloorplanSummary[]> {
  const rows = await db.showFloorplan.findMany({
    where: { showId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      updatedAt: true,
      revision: true,
      tableCount: true,
      vendorCount: true,
    },
  });

  return rows.map(toSummary);
}

export async function getLatestShowFloorplan(showId: string): Promise<ShowFloorplanRecord | null> {
  const row = await db.showFloorplan.findFirst({
    where: { showId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      dataJson: true,
      updatedAt: true,
      revision: true,
      tableCount: true,
      vendorCount: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...toSummary(row),
    data: asDocumentSlice(row.dataJson),
  };
}

export async function getShowFloorplan(showId: string, id: string): Promise<ShowFloorplanRecord | null> {
  const row = await db.showFloorplan.findFirst({
    where: { id, showId },
    select: {
      id: true,
      name: true,
      dataJson: true,
      updatedAt: true,
      revision: true,
      tableCount: true,
      vendorCount: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...toSummary(row),
    data: asDocumentSlice(row.dataJson),
  };
}

export async function saveShowFloorplan(input: {
  id?: string | null;
  showId: string;
  venueId?: string | null;
  name: string;
  data: DocumentSlice;
  actorUserId: string;
  expectedRevision?: number | null;
}): Promise<ShowFloorplanSummary> {
  const normalizedName = input.name.trim() || "Floor Plan";
  const tableCount = Object.keys(input.data.tables).length;
  const vendorCount = Object.keys(input.data.vendors).length;

  if (input.id) {
    const existing = await db.showFloorplan.findFirst({
      where: { id: input.id, showId: input.showId },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        revision: true,
        tableCount: true,
        vendorCount: true,
      },
    });

    if (!existing) {
      throw new Error("Floorplan not found.");
    }

    if (
      input.expectedRevision != null &&
      existing.revision !== input.expectedRevision
    ) {
      throw new ShowFloorplanRevisionConflictError(
        "This floorplan changed on the server. Reload it before saving again.",
        toSummary(existing)
      );
    }

    const saved = await db.showFloorplan.update({
      where: { id: existing.id },
      data: {
        name: normalizedName,
        dataJson: asInputJsonValue(input.data),
        revision: { increment: 1 },
        tableCount,
        vendorCount,
        venueId: input.venueId ?? null,
        updatedById: input.actorUserId,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        revision: true,
        tableCount: true,
        vendorCount: true,
      },
    });

    return toSummary(saved);
  }

  const existingByName = await db.showFloorplan.findFirst({
    where: { showId: input.showId, name: normalizedName },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      revision: true,
      tableCount: true,
      vendorCount: true,
    },
  });

  if (existingByName) {
    if (
      input.expectedRevision != null &&
      existingByName.revision !== input.expectedRevision
    ) {
      throw new ShowFloorplanRevisionConflictError(
        "This floorplan changed on the server. Reload it before saving again.",
        toSummary(existingByName)
      );
    }

    const saved = await db.showFloorplan.update({
      where: { id: existingByName.id },
      data: {
        dataJson: asInputJsonValue(input.data),
        revision: { increment: 1 },
        tableCount,
        vendorCount,
        venueId: input.venueId ?? null,
        updatedById: input.actorUserId,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        revision: true,
        tableCount: true,
        vendorCount: true,
      },
    });

    return toSummary(saved);
  }

  const saved = await db.showFloorplan.create({
    data: {
      showId: input.showId,
      venueId: input.venueId ?? null,
      name: normalizedName,
      dataJson: asInputJsonValue(input.data),
      tableCount,
      vendorCount,
      createdById: input.actorUserId,
      updatedById: input.actorUserId,
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      revision: true,
      tableCount: true,
      vendorCount: true,
    },
  });

  return toSummary(saved);
}

export async function deleteShowFloorplan(showId: string, id: string): Promise<void> {
  await db.showFloorplan.deleteMany({
    where: { showId, id },
  });
}
function asDocumentSlice(value: Prisma.JsonValue): DocumentSlice {
  return value as unknown as DocumentSlice;
}

function asInputJsonValue(value: DocumentSlice): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}
