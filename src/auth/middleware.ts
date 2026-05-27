import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { prisma } from "../db.ts";
import { verifyAccessToken } from "./jwt.ts";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; role: UserRole };
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: claims.sub, role: claims.role, accountStatus: "active" },
      select: { id: true, role: true }
    });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.auth = { userId: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.auth.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
