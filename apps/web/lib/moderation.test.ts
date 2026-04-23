import assert from "node:assert/strict";
import test, { afterEach, before, mock } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/csn_test";
process.env.CSN_DATA_MODE = "live";

let db: typeof import("./db").db;
let createModeratorSessionToken: typeof import("./moderator-session").createModeratorSessionToken;
let verifyModeratorSessionToken: typeof import("./moderator-session").verifyModeratorSessionToken;
let approveShowSubmission: typeof import("./submissions").approveShowSubmission;
let rejectShowSubmission: typeof import("./submissions").rejectShowSubmission;
const restorers: Array<() => void> = [];

function stubMethod<
  T extends Record<string, unknown>,
  K extends keyof T & string,
  F extends T[K] & ((...args: any[]) => any),
>(target: T, key: K, implementation: F) {
  const original = target[key];
  const calls: Array<{ arguments: Parameters<F> }> = [];

  const wrapped = ((...args: Parameters<F>) => {
    calls.push({ arguments: args });
    return implementation(...args);
  }) as F;

  (target as T & Record<string, unknown>)[key] = wrapped;
  restorers.push(() => {
    (target as T & Record<string, unknown>)[key] = original;
  });

  return { mock: { calls } };
}

before(async () => {
  ({ db } = await import("./db"));
  ({ createModeratorSessionToken, verifyModeratorSessionToken } = await import(
    "./moderator-session"
  ));
  ({ approveShowSubmission, rejectShowSubmission } = await import("./submissions"));
});

afterEach(() => {
  mock.restoreAll();
  while (restorers.length > 0) {
    restorers.pop()?.();
  }
});

test("createModeratorSessionToken returns a verifiable moderator token", async () => {
  const token = await createModeratorSessionToken("moderator-123", "super-secret");
  const payload = await verifyModeratorSessionToken(token, "super-secret");

  assert.ok(payload);
  assert.equal(payload.uid, "moderator-123");
  assert.equal(payload.aud, "card-show-nation-moderator");
  assert.equal(payload.v, 1);
});

test("verifyModeratorSessionToken rejects tampered signatures", async () => {
  const token = await createModeratorSessionToken("moderator-123", "super-secret");
  const [payloadSegment, signatureSegment] = token.split(".");
  const tamperedToken = `${payloadSegment}.${signatureSegment.slice(0, -1)}x`;

  const payload = await verifyModeratorSessionToken(tamperedToken, "super-secret");

  assert.equal(payload, null);
});

test("verifyModeratorSessionToken rejects tokens issued too far in the future", async () => {
  const now = 1_700_000_000_000;
  const dateNowMock = mock.method(Date, "now", () => now + 120_000);
  const token = await createModeratorSessionToken("moderator-123", "super-secret");

  dateNowMock.mock.mockImplementation(() => now);
  const payload = await verifyModeratorSessionToken(token, "super-secret");

  assert.equal(payload, null);
});

test("verifyModeratorSessionToken rejects expired tokens", async () => {
  const now = 1_700_000_000_000;
  const dateNowMock = mock.method(Date, "now", () => now);
  const token = await createModeratorSessionToken("moderator-123", "super-secret", 10);

  dateNowMock.mock.mockImplementation(() => now + 11_000);
  const payload = await verifyModeratorSessionToken(token, "super-secret");

  assert.equal(payload, null);
});

test("approveShowSubmission rejects non-admin, non-moderator reviewer roles", async () => {
  await assert.rejects(
    () =>
      approveShowSubmission("submission-1", {
        reviewerId: "fan-1",
        reviewerRole: "FAN",
      }),
    /Only admin or moderator reviewers can approve submissions\./
  );
});

test("approveShowSubmission returns the existing reviewed show for already-approved submissions", async () => {
  const findSubmissionMock = stubMethod(db.showSubmission, "findUnique", async () => ({
    id: "submission-1",
    status: "APPROVED",
    reviewedShowId: "show-42",
  }));
  const findShowMock = stubMethod(db.show, "findUnique", async () => ({
    id: "show-42",
    title: "Existing Show",
  }));
  const updateSubmissionMock = stubMethod(db.showSubmission, "update", async () => {
    throw new Error("approve should not update an already-reviewed submission");
  });
  const auditLogMock = stubMethod(db.auditLog, "create", async () => {
    throw new Error("approve should not write an audit log when it short-circuits");
  });

  const result = await approveShowSubmission("submission-1", {
    reviewerId: "moderator-1",
    reviewerRole: "MODERATOR",
  });

  assert.deepEqual(result, {
    id: "show-42",
    title: "Existing Show",
  });
  assert.equal(findSubmissionMock.mock.calls.length, 1);
  assert.equal(findShowMock.mock.calls.length, 1);
  assert.equal(updateSubmissionMock.mock.calls.length, 0);
  assert.equal(auditLogMock.mock.calls.length, 0);
});

test("rejectShowSubmission rejects non-admin, non-moderator reviewer roles", async () => {
  await assert.rejects(
    () =>
      rejectShowSubmission("submission-1", "Nope", {
        reviewerId: "fan-1",
        reviewerRole: "FAN",
      }),
    /Only admin or moderator reviewers can reject submissions\./
  );
});

test("rejectShowSubmission returns null when the submission does not exist", async () => {
  const findSubmissionMock = stubMethod(db.showSubmission, "findUnique", async () => null);
  const updateSubmissionMock = stubMethod(db.showSubmission, "update", async () => {
    throw new Error("reject should not update a missing submission");
  });
  const auditLogMock = stubMethod(db.auditLog, "create", async () => {
    throw new Error("reject should not write an audit log for a missing submission");
  });

  const result = await rejectShowSubmission("missing-submission", "Nope", {
    reviewerId: "moderator-1",
    reviewerRole: "MODERATOR",
  });

  assert.equal(result, null);
  assert.equal(findSubmissionMock.mock.calls.length, 1);
  assert.equal(updateSubmissionMock.mock.calls.length, 0);
  assert.equal(auditLogMock.mock.calls.length, 0);
});

test("rejectShowSubmission short-circuits already-reviewed submissions", async () => {
  const existingSubmission = {
    id: "submission-1",
    status: "APPROVED",
    notes: "Already handled",
  };

  const findSubmissionMock = stubMethod(
    db.showSubmission,
    "findUnique",
    async () => existingSubmission
  );
  const updateSubmissionMock = stubMethod(db.showSubmission, "update", async () => {
    throw new Error("reject should not update an already-reviewed submission");
  });
  const auditLogMock = stubMethod(db.auditLog, "create", async () => {
    throw new Error("reject should not write an audit log when it short-circuits");
  });

  const result = await rejectShowSubmission("submission-1", "New note", {
    reviewerId: "moderator-1",
    reviewerRole: "MODERATOR",
  });

  assert.equal(result, existingSubmission);
  assert.equal(findSubmissionMock.mock.calls.length, 1);
  assert.equal(updateSubmissionMock.mock.calls.length, 0);
  assert.equal(auditLogMock.mock.calls.length, 0);
});

test("rejectShowSubmission updates and audits pending submissions", async () => {
  const findSubmissionMock = stubMethod(db.showSubmission, "findUnique", async () => ({
    id: "submission-1",
    status: "PENDING",
    submitterEmail: "submitter@example.com",
  }));
  const updateSubmissionMock = stubMethod(db.showSubmission, "update", async ({ data }) => ({
    id: "submission-1",
    submitterEmail: "submitter@example.com",
    ...data,
  }));
  const auditLogMock = stubMethod(db.auditLog, "create", async (input) => input);

  const result = await rejectShowSubmission("submission-1", "Missing dates", {
    reviewerId: "moderator-1",
    reviewerRole: "MODERATOR",
  });

  assert.equal(findSubmissionMock.mock.calls.length, 1);
  assert.equal(updateSubmissionMock.mock.calls.length, 1);
  assert.equal(auditLogMock.mock.calls.length, 1);

  const updateArgs = updateSubmissionMock.mock.calls[0]?.arguments[0];
  assert.deepEqual(updateArgs, {
    where: { id: "submission-1" },
    data: {
      status: "REJECTED",
      notes: "Missing dates",
      reviewerId: "moderator-1",
      reviewerRole: "MODERATOR",
    },
  });

  const auditArgs = auditLogMock.mock.calls[0]?.arguments[0];
  assert.deepEqual(auditArgs, {
    data: {
      actorId: "moderator-1",
      actorRole: "MODERATOR",
      action: "submission.rejected",
      targetType: "ShowSubmission",
      targetId: "submission-1",
      details: {
        notes: "Missing dates",
        submitterEmail: "submitter@example.com",
      },
    },
  });

  assert.deepEqual(result, {
    id: "submission-1",
    submitterEmail: "submitter@example.com",
    status: "REJECTED",
    notes: "Missing dates",
    reviewerId: "moderator-1",
    reviewerRole: "MODERATOR",
  });
});
