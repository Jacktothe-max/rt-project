import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import type { AccountStatus, UserRole } from "@prisma/client";
import type { AuthenticatedRequest } from "./middleware.ts";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret-value-long-enough";
process.env.JWT_ISSUER = "rt-marketplace-test";

const { signAccessToken } = await import("./jwt.ts");
const { createRequireAuth, requireRole } = await import("./middleware.ts");

type AuthUser = { id: string; role: UserRole; accountStatus: AccountStatus };

function makeRequest(token: string): AuthenticatedRequest {
  return {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined;
    }
  } as AuthenticatedRequest;
}

function makeResponse(): Response & { statusCode?: number; body?: unknown } {
  const response = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };

  return response as Response & { statusCode?: number; body?: unknown };
}

test("requireAuth uses the current database role instead of stale token claims", async () => {
  const token = signAccessToken({ userId: "user-1", role: "admin" });
  const req = makeRequest(token);
  const res = makeResponse();
  let nextCalled = false;
  const findUser = async (): Promise<AuthUser> => ({
    id: "user-1",
    role: "school",
    accountStatus: "active"
  });

  await createRequireAuth(findUser)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.auth, { userId: "user-1", role: "school" });

  const roleRes = makeResponse();
  let roleNextCalled = false;
  requireRole("admin")(req, roleRes, () => {
    roleNextCalled = true;
  });

  assert.equal(roleNextCalled, false);
  assert.equal(roleRes.statusCode, 403);
});

test("requireAuth rejects disabled users even when their token is otherwise valid", async () => {
  const token = signAccessToken({ userId: "user-2", role: "teacher" });
  const req = makeRequest(token);
  const res = makeResponse();
  let nextCalled = false;
  const findUser = async (): Promise<AuthUser> => ({
    id: "user-2",
    role: "teacher",
    accountStatus: "disabled"
  });

  await createRequireAuth(findUser)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
  assert.equal(req.auth, undefined);
});

test("requireAuth rejects tokens for users that no longer exist", async () => {
  const token = signAccessToken({ userId: "deleted-user", role: "school" });
  const req = makeRequest(token);
  const res = makeResponse();
  let nextCalled = false;

  await createRequireAuth(async () => null)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
  assert.equal(req.auth, undefined);
});
