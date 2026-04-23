import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

type RegisterAdminInput = {
  email: string;
  password: string;
  name: string;
};

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

export async function registerInitialAdmin(input: RegisterAdminInput) {
  const email = input.email.trim().toLowerCase();
  const [existingUser, adminCount, passwordHash] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.count({ where: { role: "ADMIN" } }),
    hashPassword(input.password),
  ]);

  if (adminCount > 0) {
    throw new Error("An admin account already exists.");
  }

  if (existingUser) {
    return db.user.update({
      where: { id: existingUser.id },
      data: {
        name: input.name,
        passwordHash,
        role: "ADMIN",
      },
    });
  }

  return db.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });
}

export async function hasAnyAdminUsers() {
  const count = await db.user.count({ where: { role: "ADMIN" } });
  return count > 0;
}
