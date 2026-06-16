import assert from "node:assert/strict";
import test from "node:test";
import type { UserRole } from "@prisma/client";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/rt_test";
process.env.JWT_SECRET ??= "0123456789abcdef";
process.env.JWT_ISSUER ??= "rt-marketplace";

const { prisma } = await import("../db.ts");
const { signAccessToken } = await import("./jwt.ts");
const { requireAuth } = await import("./middleware.ts");

type MockUser = {
  id: string;
  role: UserRole;
  accountStatus: "active" | "suspended" | "disabled";
} | null;

type AuthResult = {
  statusCode: number;
  body: unknown;
  nextCalled: boolean;
  auth: unknown;
};

async function invokeRequireAuth(token: string): Promise<AuthResult> {
  const req: any = {
    auth: undefined,
    header: (name: string) => (name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined)
  };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  return { statusCode: res.statusCode, body: res.body, nextCalled, auth: req.auth };
}

test("requireAuth revalidates token subject against current database user", async () => {
  const originalFindUnique = prisma.user.findUnique.bind(prisma.user);
  const token = signAccessToken({ userId: "user-1", role: "admin" });

  try {
    (prisma.user.findUnique as any) = async (): Promise<MockUser> => ({
      id: "user-1",
      role: "teacher",
      accountStatus: "active"
    });

    assert.deepEqual(await invokeRequireAuth(token), {
      statusCode: 200,
      body: undefined,
      nextCalled: true,
      auth: { userId: "user-1", role: "teacher" }
    });

    (prisma.user.findUnique as any) = async (): Promise<MockUser> => ({
      id: "user-1",
      role: "admin",
      accountStatus: "suspended"
    });

    assert.deepEqual(await invokeRequireAuth(token), {
      statusCode: 403,
      body: { error: "Forbidden" },
      nextCalled: false,
      auth: undefined
    });

    (prisma.user.findUnique as any) = async (): Promise<MockUser> => null;

    assert.deepEqual(await invokeRequireAuth(token), {
      statusCode: 401,
      body: { error: "Unauthorized" },
      nextCalled: false,
      auth: undefined
    });
  } finally {
    (prisma.user.findUnique as any) = originalFindUnique;
    await prisma.$disconnect();
  }
});
