import assert from "node:assert/strict";
import test, { afterEach, before, mock } from "node:test";

process.env.DATABASE_URL ??= "postgresql://user@localhost:5432/csn_test";
process.env.CSN_DATA_MODE = "live";

let db: typeof import("./db").db;
let createModeratorSessionToken: typeof import("./moderator-session").createModeratorSessionToken;
let verifyModeratorSessionToken: typeof import("./moderator-session").verifyModeratorSessionToken;
let validateModeratorSessionSecret: typeof import("./moderator-auth").validateModeratorSessionSecret;
let MIN_MODERATOR_SESSION_SECRET_LENGTH: typeof import("./moderator-auth").MIN_MODERATOR_SESSION_SECRET_LENGTH;
let approveShowSubmission: typeof import("./submissions").approveShowSubmission;
let rejectShowSubmission: typeof import("./submissions").rejectShowSubmission;
let getModeratorVisibleSubmissions: typeof import("./submissions").getModeratorVisibleSubmissions;
let getModeratorVisibleSubmissionById: typeof import("./submissions").getModeratorVisibleSubmissionById;
const restorers: Array<() => void> = [];

function stubMethod(
  target: any,
  key: string,
  implementation: (...args: any[]) => any
) {
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
  ({ createModeratorSessionToken, verifyModeratorSessionToken } = await import(
    "./moderator-session"
  ));
  ({ validateModeratorSessionSecret, MIN_MODERATOR_SESSION_SECRET_LENGTH } = await import(
    "./moderator-auth"
  ));
  ({
    approveShowSubmission,
    rejectShowSubmission,
    getModeratorVisibleSubmissions,
    getModeratorVisibleSubmissionById,
  } = await import("./submissions"));
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
  const decodedPayload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  decodedPayload.uid = "moderator-456";
  const tamperedPayloadSegment = Buffer.from(JSON.stringify(decodedPayload), "utf8").toString(
    "base64url"
  );
  const tamperedToken = `${tamperedPayloadSegment}.${signatureSegment}`;

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

test("validateModeratorSessionSecret rejects missing secrets", () => {
  assert.deepEqual(validateModeratorSessionSecret(""), {
    secret: null,
    error: "missing",
  });
});

test("validateModeratorSessionSecret rejects short secrets", () => {
  assert.deepEqual(validateModeratorSessionSecret("x".repeat(31)), {
    secret: null,
    error: "too_short",
  });
});

test("validateModeratorSessionSecret accepts trimmed strong secrets", () => {
  const strongSecret = `  ${"x".repeat(MIN_MODERATOR_SESSION_SECRET_LENGTH)}  `;

  assert.deepEqual(validateModeratorSessionSecret(strongSecret), {
    secret: "x".repeat(MIN_MODERATOR_SESSION_SECRET_LENGTH),
    error: null,
  });
});

test("getModeratorVisibleSubmissions returns only pending and self-reviewed submissions", async () => {
  const findManyMock = stubMethod(db.showSubmission, "findMany", async () => [
    { id: "pending-1", status: "PENDING", reviewerId: null },
    { id: "reviewed-by-self", status: "APPROVED", reviewerId: "moderator-1" },
  ]);

  const result = await getModeratorVisibleSubmissions("moderator-1");

  assert.equal(findManyMock.mock.calls.length, 1);
  assert.deepEqual(findManyMock.mock.calls[0]?.arguments[0], {
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    where: {
      OR: [{ status: "PENDING" }, { reviewerId: "moderator-1" }],
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  assert.deepEqual(result, [
    { id: "pending-1", status: "PENDING", reviewerId: null },
    { id: "reviewed-by-self", status: "APPROVED", reviewerId: "moderator-1" },
  ]);
});

test("getModeratorVisibleSubmissionById allows pending submissions for any moderator", async () => {
  const getSubmissionMock = stubMethod(db.showSubmission, "findUnique", async () => ({
    id: "submission-1",
    status: "PENDING",
    reviewerId: null,
  }));

  const result = await getModeratorVisibleSubmissionById("submission-1", "moderator-1");

  assert.equal(getSubmissionMock.mock.calls.length, 1);
  assert.deepEqual(result, {
    id: "submission-1",
    status: "PENDING",
    reviewerId: null,
  });
});

test("getModeratorVisibleSubmissionById hides other moderators reviewed submissions", async () => {
  const getSubmissionMock = stubMethod(db.showSubmission, "findUnique", async () => ({
    id: "submission-1",
    status: "APPROVED",
    reviewerId: "moderator-2",
  }));

  const result = await getModeratorVisibleSubmissionById("submission-1", "moderator-1");

  assert.equal(getSubmissionMock.mock.calls.length, 1);
  assert.equal(result, null);
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
