import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import { createRequireAuth, type AuthenticatedRequest } from "./middleware.ts";

type TestUser = {
  id: string;
  role: "teacher" | "school" | "admin";
  accountStatus: "active" | "suspended" | "disabled";
};

function createRequest(authHeader: string | undefined): AuthenticatedRequest {
  return {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? authHeader : undefined;
    }
  } as AuthenticatedRequest;
}

function createResponse() {
  const state: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    }
  } as Response;
  return { res, state };
}

async function runAuthWithUser(user: TestUser | null) {
  const req = createRequest("Bearer valid-token");
  const { res, state } = createResponse();
  let nextCalled = false;
  let nextError: unknown;
  const handler = createRequireAuth({
    verifyToken: () => ({ sub: "user-1", role: "teacher", iss: "test" }),
    findUserById: async () => user
  });

  await handler(req, res, (err?: unknown) => {
    nextCalled = true;
    nextError = err;
  });

  return { req, state, nextCalled, nextError };
}

test("requireAuth accepts an active user whose role still matches the token", async () => {
  const result = await runAuthWithUser({ id: "user-1", role: "teacher", accountStatus: "active" });

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError, undefined);
  assert.deepEqual(result.req.auth, { userId: "user-1", role: "teacher" });
  assert.equal(result.state.statusCode, undefined);
});

test("requireAuth rejects a token for a deleted user", async () => {
  const result = await runAuthWithUser(null);

  assert.equal(result.nextCalled, false);
  assert.equal(result.state.statusCode, 401);
  assert.deepEqual(result.state.body, { error: "Unauthorized" });
  assert.equal(result.req.auth, undefined);
});

test("requireAuth rejects a token for a disabled user", async () => {
  const result = await runAuthWithUser({ id: "user-1", role: "teacher", accountStatus: "disabled" });

  assert.equal(result.nextCalled, false);
  assert.equal(result.state.statusCode, 401);
  assert.deepEqual(result.state.body, { error: "Unauthorized" });
  assert.equal(result.req.auth, undefined);
});

test("requireAuth rejects a token when the user's role has changed", async () => {
  const result = await runAuthWithUser({ id: "user-1", role: "school", accountStatus: "active" });

  assert.equal(result.nextCalled, false);
  assert.equal(result.state.statusCode, 401);
  assert.deepEqual(result.state.body, { error: "Unauthorized" });
  assert.equal(result.req.auth, undefined);
});
