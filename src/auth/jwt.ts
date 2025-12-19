import jwt from "jsonwebtoken";
import { env } from "../config.ts";
import type { UserRole } from "@prisma/client";

export type AccessTokenClaims = {
  sub: string;
  role: UserRole;
  iss: string;
};

const ACCESS_TOKEN_EXPIRES_IN = "7d";

export function signAccessToken(input: { userId: string; role: UserRole }): string {
  const claims: AccessTokenClaims = { sub: input.userId, role: input.role, iss: env.JWT_ISSUER };
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: env.JWT_ISSUER });
  if (typeof decoded !== "object" || decoded === null) throw new Error("Invalid token");
  const claims = decoded as Partial<AccessTokenClaims>;
  if (!claims.sub || !claims.role || !claims.iss) throw new Error("Invalid token");
  return claims as AccessTokenClaims;
}
