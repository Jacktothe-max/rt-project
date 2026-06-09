import type { NextFunction, Request, Response } from "express";
import type { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "../db.ts";
import { verifyAccessToken } from "./jwt.ts";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; role: UserRole };
};

type AuthUser = { id: string; role: UserRole; accountStatus: AccountStatus };

type RequireAuthDependencies = {
  verifyToken: typeof verifyAccessToken;
  findUserById: (userId: string) => Promise<AuthUser | null>;
};

export function createRequireAuth({ verifyToken, findUserById }: RequireAuthDependencies) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.slice("Bearer ".length).trim();

    let claims: ReturnType<typeof verifyAccessToken>;
    try {
      claims = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let user: AuthUser | null;
    try {
      user = await findUserById(claims.sub);
    } catch (e) {
      return next(e);
    }

    if (!user || user.accountStatus !== "active" || user.role !== claims.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.auth = { userId: user.id, role: user.role };
    return next();
  };
}

export const requireAuth = createRequireAuth({
  verifyToken: verifyAccessToken,
  findUserById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accountStatus: true }
    })
});

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
