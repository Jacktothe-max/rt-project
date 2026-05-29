import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { prisma } from "../db.ts";
import { verifyAccessToken, type AccessTokenClaims } from "./jwt.ts";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; role: UserRole };
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice("Bearer ".length).trim();
  let claims: AccessTokenClaims;

  try {
    claims = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, role: true, accountStatus: true }
    });

    if (!user || user.accountStatus !== "active" || user.role !== claims.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.auth = { userId: user.id, role: user.role };
    return next();
  } catch (e) {
    return next(e);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
