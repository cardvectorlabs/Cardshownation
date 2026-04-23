import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";
import { hashPassword, verifyPassword } from "@/lib/passwords";

type RegisterFanInput = {
  email: string;
  password: string;
  name: string;
  stateCodes: string[];
};

type CreateModeratorInput = {
  email: string;
  password: string;
  name: string;
  actorId: string;
};

type AdminModeratorActionInput = {
  moderatorUserId: string;
  actorId: string;
};

export async function registerFanAccount(input: RegisterFanInput) {
  const email = input.email.trim().toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("An account already exists for that email.");
  }

  const passwordHash = await hashPassword(input.password);
  const stateCodes = [...new Set(input.stateCodes.map((code) => code.trim().toUpperCase()).filter(Boolean))];

  return db.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: "FAN",
      subscriptions: stateCodes.length
        ? {
            create: stateCodes.map((stateCode) => ({
              stateCode,
              emailEnabled: true,
            })),
          }
        : undefined,
    },
    include: {
      subscriptions: true,
    },
  });
}

export async function authenticateFan(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.role !== "FAN") {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

export async function getFanAccountData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        orderBy: { stateCode: "asc" },
      },
      _count: {
        select: {
          savedShows: true,
        },
      },
    },
  });

  if (!user || user.role !== "FAN") {
    return null;
  }

  return user;
}

export async function updateFanStateSubscriptions(userId: string, stateCodes: string[]) {
  const normalizedCodes = [...new Set(stateCodes.map((code) => code.trim().toUpperCase()).filter(Boolean))];

  await db.$transaction(async (tx) => {
    await tx.userStateSubscription.deleteMany({
      where: {
        userId,
        stateCode: {
          notIn: normalizedCodes.length ? normalizedCodes : ["__NONE__"],
        },
      },
    });

    for (const stateCode of normalizedCodes) {
      await tx.userStateSubscription.upsert({
        where: {
          userId_stateCode: {
            userId,
            stateCode,
          },
        },
        create: {
          userId,
          stateCode,
          emailEnabled: true,
        },
        update: {
          emailEnabled: true,
        },
      });
    }
  });
}

export async function createModeratorAccountByAdmin(input: CreateModeratorInput) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser && existingUser.role !== "FAN" && existingUser.role !== "MODERATOR") {
    throw new Error("That email already belongs to a protected account type.");
  }

  const user = existingUser
    ? await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: input.name,
          passwordHash,
          role: "MODERATOR",
        },
      })
    : await db.user.create({
        data: {
          name: input.name,
          email,
          passwordHash,
          role: "MODERATOR",
        },
      });

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: "ADMIN",
    action: "moderator.created",
    targetType: "User",
    targetId: user.id,
    details: {
      email: user.email,
    },
  });

  return user;
}

export async function listModeratorAccounts() {
  return db.user.findMany({
    where: { role: "MODERATOR" },
    include: {
      _count: {
        select: {
          moderatedSubmissions: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getUserRoleStats() {
  const [fans, moderators, promoters, admins, subscriptions] = await Promise.all([
    db.user.count({ where: { role: "FAN" } }),
    db.user.count({ where: { role: "MODERATOR" } }),
    db.user.count({ where: { role: "ORGANIZER" } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.userStateSubscription.count(),
  ]);

  return { fans, moderators, promoters, admins, subscriptions };
}

export async function resetModeratorPasswordByAdmin(
  input: AdminModeratorActionInput & { nextPassword: string }
) {
  const user = await db.user.findUnique({
    where: { id: input.moderatorUserId },
  });

  if (!user || user.role !== "MODERATOR") {
    throw new Error("Moderator account not found.");
  }

  const passwordHash = await hashPassword(input.nextPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: "ADMIN",
    action: "moderator.password_reset",
    targetType: "User",
    targetId: user.id,
    details: {
      email: user.email,
    },
  });
}

export async function revokeModeratorAccessByAdmin(input: AdminModeratorActionInput) {
  const user = await db.user.findUnique({
    where: { id: input.moderatorUserId },
  });

  if (!user || user.role !== "MODERATOR") {
    throw new Error("Moderator account not found.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: "FAN" },
  });

  await writeAuditLog({
    actorId: input.actorId,
    actorRole: "ADMIN",
    action: "moderator.revoked",
    targetType: "User",
    targetId: user.id,
    details: {
      email: user.email,
    },
  });
}
