import { Router, type Response } from "express";
import { prisma } from "../../db.ts";
import { requireAuth, type AuthenticatedRequest } from "../../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: V3 Countries
 *
 * /v3/configs:
 *   get:
 *     tags: [V3 Countries]
 *     summary: List country configs (Phase 3)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 */

// Phase 3: country-aware configuration (scaffold)
router.get("/configs", requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const rows = await prismaAny.countryConfig.findMany({ orderBy: { countryCode: "asc" } });
  return res.status(200).json({
    countries: rows.map((c: any) => ({
      country_code: c.countryCode,
      currency_code: c.currencyCode,
      legal_url: c.legalUrl ?? null,
      pricing_json: c.pricingJson ?? null
    }))
  });
});

export default router;


