import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Admin
 *
 * /v3/admin/country-configs:
 *   get:
 *     tags: [Admin]
 *     summary: List country configs (admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /v3/admin/country-configs/{countryCode}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a country config (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema: { type: string, example: "AU" }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *   put:
 *     tags: [Admin]
 *     summary: Upsert a country config (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema: { type: string, example: "AU" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */

const CountryCodeSchema = z.enum(["AU", "NZ", "US", "CA", "GB"]);
const CurrencyCodeSchema = z.enum(["AUD", "NZD", "USD", "CAD", "GBP"]);

// Admin list
router.get(
  "/admin/country-configs",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await prismaAny.countryConfig.findMany({ orderBy: { countryCode: "asc" } });
    return res.status(200).json({
      country_configs: rows.map((c: any) => ({
        country_code: c.countryCode,
        currency_code: c.currencyCode,
        legal_url: c.legalUrl ?? null,
        pricing_json: c.pricingJson ?? null,
        updated_at: c.updatedAt ? new Date(c.updatedAt).toISOString() : null
      }))
    });
  }
);

// Admin get
router.get(
  "/admin/country-configs/:countryCode",
  requireAuth,
  requireRole("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = CountryCodeSchema.safeParse(req.params.countryCode?.toUpperCase());
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const row = await prismaAny.countryConfig.findUnique({ where: { countryCode: parsed.data } });
    if (!row) return res.status(404).json({ error: "Not found" });

    return res.status(200).json({
      country_config: {
        country_code: row.countryCode,
        currency_code: row.currencyCode,
        legal_url: row.legalUrl ?? null,
        pricing_json: row.pricingJson ?? null,
        updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : null
      }
    });
  }
);

// Admin upsert (create/update)
router.put(
  "/admin/country-configs/:countryCode",
  requireAuth,
  requireRole("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const cc = CountryCodeSchema.safeParse(req.params.countryCode?.toUpperCase());
    if (!cc.success) return res.status(400).json({ error: "Invalid request" });

    const bodySchema = z.object({
      currency_code: CurrencyCodeSchema,
      legal_url: z.string().url().nullable(),
      pricing_json: z.string().nullable()
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const updated = await prismaAny.countryConfig.upsert({
      where: { countryCode: cc.data },
      update: {
        currencyCode: parsed.data.currency_code,
        legalUrl: parsed.data.legal_url,
        pricingJson: parsed.data.pricing_json
      },
      create: {
        countryCode: cc.data,
        currencyCode: parsed.data.currency_code,
        legalUrl: parsed.data.legal_url,
        pricingJson: parsed.data.pricing_json
      }
    });

    return res.status(200).json({
      country_config: {
        country_code: updated.countryCode,
        currency_code: updated.currencyCode,
        legal_url: updated.legalUrl ?? null,
        pricing_json: updated.pricingJson ?? null,
        updated_at: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : null
      }
    });
  }
);

export default router;


