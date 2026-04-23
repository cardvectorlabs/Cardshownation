import { db } from "@/lib/db";
import { isFixtureMode } from "@/lib/data-mode";
import type { Prisma, UserRole } from "@csn/db";

type AuditLogInput = {
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Prisma.InputJsonValue | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  if (isFixtureMode()) {
    return null;
  }

  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      details: input.details ?? undefined,
    },
  });
}

export async function getRecentAuditLogs(limit = 20) {
  if (isFixtureMode()) {
    return [];
  }

  return db.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
