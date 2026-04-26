import assert from "node:assert/strict";
import test, { afterEach, before, mock } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user@localhost:5432/csn_test";
process.env.CSN_DATA_MODE = "live";
process.env.NEXT_PUBLIC_APP_URL = "https://cardshownation.com";

let db: typeof import("./db").db;
let usersModule: typeof import("./users");
const restorers: Array<() => void> = [];

function stubMethod(target: any, key: string, implementation: (...args: any[]) => any) {
  const original = target[key];
  const calls: Array<{ arguments: any[] }> = [];

  const wrapped = (...args: any[]) => {
    calls.push({ arguments: args });
    return implementation(...args);
  };

  target[key] = wrapped;
  restorers.push(() => {
    target[key] = original;
  });

  return { mock: { calls } };
}

before(async () => {
  ({ db } = await import("./db"));
  usersModule = await import("./users");
});

afterEach(() => {
  mock.restoreAll();
  while (restorers.length > 0) {
    restorers.pop()?.();
  }
});

test("assignModeratorAccessByAdmin promotes fan accounts and writes an audit log", async () => {
  const findUserMock = stubMethod(db.user, "findUnique", async () => ({
    id: "fan-1",
    email: "fan@example.com",
    role: "FAN",
  }));
  const updateUserMock = stubMethod(db.user, "update", async (input) => input);
  const auditLogMock = stubMethod(db.auditLog, "create", async (input) => input);

  await usersModule.assignModeratorAccessByAdmin({
    actorId: "admin-1",
    userId: "fan-1",
  });

  assert.equal(findUserMock.mock.calls.length, 1);
  assert.deepEqual(updateUserMock.mock.calls[0]?.arguments[0], {
    where: { id: "fan-1" },
    data: { role: "MODERATOR" },
  });
  assert.deepEqual(auditLogMock.mock.calls[0]?.arguments[0], {
    data: {
      actorId: "admin-1",
      actorRole: "ADMIN",
      action: "moderator.assigned",
      targetType: "User",
      targetId: "fan-1",
      details: {
        email: "fan@example.com",
        previousRole: "FAN",
      },
    },
  });
});

test("assignModeratorAccessByAdmin rejects organizer accounts", async () => {
  stubMethod(db.user, "findUnique", async () => ({
    id: "organizer-1",
    email: "promoter@example.com",
    role: "ORGANIZER",
  }));

  await assert.rejects(
    () =>
      usersModule.assignModeratorAccessByAdmin({
        actorId: "admin-1",
        userId: "organizer-1",
      }),
    /cannot be converted to moderator/i
  );
});

test("getPasswordResetPathForRole returns the correct route for each account type", () => {
  assert.equal(usersModule.getPasswordResetPathForRole("FAN"), "/account/reset-password");
  assert.equal(usersModule.getPasswordResetPathForRole("MODERATOR"), "/moderator/reset-password");
  assert.equal(usersModule.getPasswordResetPathForRole("ORGANIZER"), "/promoter/reset-password");
});

test("deleteUserAccountByAdmin deletes non-admin users and records the action", async () => {
  stubMethod(db.user, "findUnique", async () => ({
    id: "user-1",
    email: "user@example.com",
    role: "FAN",
    organizer: null,
  }));
  const deleteUserMock = stubMethod(db.user, "delete", async (input) => input);
  const auditLogMock = stubMethod(db.auditLog, "create", async (input) => input);

  await usersModule.deleteUserAccountByAdmin({
    actorId: "admin-1",
    userId: "user-1",
  });

  assert.deepEqual(deleteUserMock.mock.calls[0]?.arguments[0], {
    where: { id: "user-1" },
  });
  assert.deepEqual(auditLogMock.mock.calls[0]?.arguments[0], {
    data: {
      actorId: "admin-1",
      actorRole: "ADMIN",
      action: "user.deleted",
      targetType: "User",
      targetId: "user-1",
      details: {
        email: "user@example.com",
        role: "FAN",
        organizerId: null,
      },
    },
  });
});
