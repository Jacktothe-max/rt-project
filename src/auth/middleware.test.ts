import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./middleware.ts";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.JWT_SECRET ??= "test-secret-with-enough-length";
process.env.JWT_ISSUER ??= "rt-marketplace-test";

const { prisma } = await import("../db.ts");
const { signAccessToken } = await import("./jwt.ts");
const { requireAuth, requireRole } = await import("./middleware.ts");

type MockUser = {
  id: string;
  role: "teacher" | "school" | "admin";
  accountStatus: "active" | "suspended" | "disabled";
};

function makeReq(token?: string): AuthenticatedRequest {
  return {
    header(name: string) {
      if (name.toLowerCase() !== "authorization") return undefined;
      return token ? `Bearer ${token}` : undefined;
    }
  } as AuthenticatedRequest;
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };

  return res as Response & typeof res;
}

async function withUserLookup(user: MockUser | null, fn: () => Promise<void>) {
  const originalFindUnique = prisma.user.findUnique;
  (prisma.user as any).findUnique = async () => user;
  try {
    await fn();
  } finally {
    (prisma.user as any).findUnique = originalFindUnique;
  }
}

test("requireAuth rejects a token whose user no longer exists", async () => {
  const token = signAccessToken({ userId: "deleted-user", role: "teacher" });
  const req = makeReq(token);
  const res = makeRes();
  let nextCalled = false;

  await withUserLookup(null, async () => {
    await requireAuth(req, res, (() => {
      nextCalled = true;
    }) as NextFunction);
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("requireAuth rejects suspended users with otherwise valid tokens", async () => {
  const token = signAccessToken({ userId: "suspended-user", role: "teacher" });
  const req = makeReq(token);
  const res = makeRes();
  let nextCalled = false;

  await withUserLookup({ id: "suspended-user", role: "teacher", accountStatus: "suspended" }, async () => {
    await requireAuth(req, res, (() => {
      nextCalled = true;
    }) as NextFunction);
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Forbidden" });
});

test("requireAuth derives the request role from the current database user", async () => {
  const token = signAccessToken({ userId: "role-changed-user", role: "admin" });
  const req = makeReq(token);
  const res = makeRes();
  let nextCalled = false;

  await withUserLookup({ id: "role-changed-user", role: "school", accountStatus: "active" }, async () => {
    await requireAuth(req, res, (() => {
      nextCalled = true;
    }) as NextFunction);
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.auth, { userId: "role-changed-user", role: "school" });

  const roleRes = makeRes();
  let roleNextCalled = false;
  requireRole("school")(req, roleRes, (() => {
    roleNextCalled = true;
  }) as NextFunction);

  assert.equal(roleNextCalled, true);
  assert.equal(roleRes.statusCode, 200);
});
