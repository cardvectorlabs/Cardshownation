import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createVerificationToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await db.emailVerificationToken.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

export async function consumeVerificationToken(token: string) {
  const record = await db.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  await db.emailVerificationToken.delete({ where: { id: record.id } });

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return record.user;
}
