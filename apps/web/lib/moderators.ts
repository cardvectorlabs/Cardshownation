import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

type RegisterModeratorInput = {
  email: string;
  password: string;
  name: string;
};

export async function registerModeratorAccount(input: RegisterModeratorInput) {
  const email = input.email.trim().toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("An account already exists for that email.");
  }

  const passwordHash = await hashPassword(input.password);

  return db.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: "MODERATOR",
    },
  });
}

export async function authenticateModerator(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.role !== "MODERATOR") {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

export async function getModeratorDashboardData(userId: string) {
  const [user, pendingCount, reviewedCount] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.showSubmission.count({ where: { status: "PENDING" } }),
    db.showSubmission.count({
      where: {
        reviewerId: userId,
      },
    }),
  ]);

  if (!user || user.role !== "MODERATOR") {
    return null;
  }

  return {
    user,
    pendingCount,
    reviewedCount,
  };
}

