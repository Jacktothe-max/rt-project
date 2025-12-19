import { Router, type Response } from "express";
import { prisma } from "../../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Subscriptions
 *
 * /v3/teacher/me/subscription:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get teacher subscription tier (Phase 3)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /v3/school/me/subscription:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get school subscription tier (Phase 3)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */

// Phase 3: subscription tier indicators (scaffold)
router.get(
  "/teacher/me/subscription",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const sub = await prismaAny.teacherSubscription.findFirst({
      where: { teacherUserId },
      orderBy: { currentPeriodEndAt: "desc" }
    });
    if (!sub) return res.status(404).json({ error: "Not found" });

    return res.status(200).json({
      subscription: {
        tier: (sub as any).tier ?? "basic",
        country_code: (sub as any).countryCode ?? null,
        currency_code: (sub as any).currencyCode ?? null,
        current_period_end_at: sub.currentPeriodEndAt.toISOString(),
        grace_period_end_at: sub.gracePeriodEndAt.toISOString()
      }
    });
  }
);

router.get(
  "/school/me/subscription",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolUserId = req.auth!.userId;
    const sub = await prismaAny.schoolSubscription.findFirst({
      where: { schoolUserId },
      orderBy: { currentPeriodEndAt: "desc" }
    });
    if (!sub) return res.status(404).json({ error: "Not found" });

    return res.status(200).json({
      subscription: {
        tier: (sub as any).tier ?? "free",
        country_code: (sub as any).countryCode ?? null,
        currency_code: (sub as any).currencyCode ?? null,
        current_period_end_at: sub.currentPeriodEndAt.toISOString(),
        grace_period_end_at: sub.gracePeriodEndAt.toISOString()
      }
    });
  }
);

export default router;


