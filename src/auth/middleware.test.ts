import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import type { UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "./middleware.ts";

process.env.DATABASE_URL ||= "postgresql://user:password@localhost:5432/rt_test";
process.env.JWT_SECRET ||= "test-secret-at-least-sixteen-characters";
process.env.JWT_ISSUER ||= "rt-marketplace-test";

const { signAccessToken } = await import("./jwt.ts");
const { requireAuth } = await import("./middleware.ts");
const { prisma } = await import("../db.ts");

type MockUser = {
  id: string;
  role: UserRole;
  accountStatus: "active" | "suspended" | "disabled";
};

function setFindUniqueMock(impl: (args: unknown) => Promise<MockUser | null>) {
  Object.defineProperty(prisma.user, "findUnique", {
    configurable: true,
    value: impl
  });
}

function makeRequest(token: string): AuthenticatedRequest {
  return {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined;
    }
  } as AuthenticatedRequest;
}

function makeResponse() {
  const res = {
    statusCode: undefined as number | undefined,
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

test.after(async () => {
  await prisma.$disconnect();
});

test("requireAuth accepts a token for a current active user", async () => {
  const token = signAccessToken({ userId: "teacher-1", role: "teacher" });
  const req = makeRequest(token);
  const res = makeResponse();
  let nextCalled = false;

  setFindUniqueMock(async (args) => {
    assert.deepEqual(args, {
      where: { id: "teacher-1" },
      select: { id: true, role: true, accountStatus: true }
    });
    return { id: "teacher-1", role: "teacher", accountStatus: "active" };
  });

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
  assert.deepEqual(req.auth, { userId: "teacher-1", role: "teacher" });
});

test("requireAuth rejects a token after the user is suspended", async () => {
  const token = signAccessToken({ userId: "teacher-1", role: "teacher" });
  const req = makeRequest(token);
  const res = makeResponse();
  let nextCalled = false;

  setFindUniqueMock(async () => ({ id: "teacher-1", role: "teacher", accountStatus: "suspended" }));

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
  assert.equal(req.auth, undefined);
});

test("requireAuth rejects a token whose role is stale", async () => {
  const token = signAccessToken({ userId: "user-1", role: "teacher" });
  const req = makeRequest(token);
  const res = makeResponse();
  let nextCalled = false;

  setFindUniqueMock(async () => ({ id: "user-1", role: "school", accountStatus: "active" }));

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
  assert.equal(req.auth, undefined);
});
