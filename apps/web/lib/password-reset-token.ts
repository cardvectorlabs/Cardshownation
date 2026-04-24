import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(userId: string) {
  // Invalidate any existing tokens for this user
  await db.passwordResetToken.deleteMany({ where: { userId } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await db.passwordResetToken.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  await db.passwordResetToken.delete({ where: { id: record.id } });
  return record.user;
}
