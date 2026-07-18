import type { NextFunction, Request, Response } from "express";
import type { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "../db.ts";
import { verifyAccessToken } from "./jwt.ts";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; role: UserRole };
};

type AuthUser = { id: string; role: UserRole; accountStatus: AccountStatus };
type AuthUserLookup = (userId: string) => Promise<AuthUser | null>;

const findAuthUser: AuthUserLookup = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, accountStatus: true }
  });
};

export function createRequireAuth(findUser: AuthUserLookup) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const claims = verifyAccessToken(token);
      const user = await findUser(claims.sub);
      if (!user || user.accountStatus !== "active") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      req.auth = { userId: user.id, role: user.role };
      return next();
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export const requireAuth = createRequireAuth(findAuthUser);

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
