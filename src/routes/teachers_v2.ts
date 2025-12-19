import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Teachers (Phase 2)
 *
 * /teachers/v2/me/availability-calendar:
 *   get:
 *     tags: [Teachers (Phase 2)]
 *     summary: Get date-specific availability (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, example: "2025-01-01" }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, example: "2025-01-31" }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *   put:
 *     tags: [Teachers (Phase 2)]
 *     summary: Upsert date-specific availability (Phase 2)
 *     security: [{ bearerAuth: [] }]
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
 *
 * /teachers/v2/me/notifications:
 *   get:
 *     tags: [Teachers (Phase 2)]
 *     summary: List notifications (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: unread
 *         required: false
 *         schema: { type: string, enum: ["true", "false"] }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /teachers/v2/me/notifications/{id}/read:
 *   post:
 *     tags: [Teachers (Phase 2)]
 *     summary: Mark notification as read (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /teachers/v2/me/boost/status:
 *   get:
 *     tags: [Teachers (Phase 2)]
 *     summary: Get boost status (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /teachers/v2/me/boost/activate:
 *   post:
 *     tags: [Teachers (Phase 2)]
 *     summary: Activate boost stub (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Subscription required }
 */

function parseISODateOnly(input: string): Date | null {
  // Accept YYYY-MM-DD only.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// -------- Availability calendar (date-specific) --------
router.get(
  "/me/availability-calendar",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const from = typeof req.query.from === "string" ? parseISODateOnly(req.query.from) : null;
    const to = typeof req.query.to === "string" ? parseISODateOnly(req.query.to) : null;
    if (!from || !to) return res.status(400).json({ error: "Invalid request" });

    const rows = await prismaAny.teacherAvailabilityCalendar.findMany({
      where: { teacherUserId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" }
    });

    return res.status(200).json({
      availability: rows.map((r: any) => ({
        date: r.date.toISOString().slice(0, 10),
        is_available: r.isAvailable
      }))
    });
  }
);

const upsertCalendarSchema = z.object({
  dates: z.array(
    z.object({
      date: z.string(),
      is_available: z.boolean()
    })
  )
});

router.put(
  "/me/availability-calendar",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const parsed = upsertCalendarSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const ops = parsed.data.dates
      .map((d) => ({ date: parseISODateOnly(d.date), isAvailable: d.is_available }))
      .filter((d): d is { date: Date; isAvailable: boolean } => d.date !== null);

    if (ops.length === 0) return res.status(400).json({ error: "Invalid request" });

    await prismaAny.$transaction(
      ops.map((o) =>
        prismaAny.teacherAvailabilityCalendar.upsert({
          where: { teacherUserId_date: { teacherUserId, date: o.date } },
          update: { isAvailable: o.isAvailable },
          create: { teacherUserId, date: o.date, isAvailable: o.isAvailable }
        })
      )
    );

    return res.status(200).json({ ok: true });
  }
);

// -------- Notifications --------
router.get(
  "/me/notifications",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const unreadOnly = req.query.unread === "true";

    const rows = await prismaAny.notification.findMany({
      where: { userId: teacherUserId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return res.status(200).json({
      notifications: rows.map((n: any) => ({
        id: n.id,
        type: n.type,
        read_status: n.isRead ? "read" : "unread",
        timestamp: n.createdAt.toISOString()
      }))
    });
  }
);

router.post(
  "/me/notifications/:id/read",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Invalid request" });

    const n = await prismaAny.notification.findFirst({ where: { id, userId: teacherUserId } });
    if (!n) return res.status(404).json({ error: "Not found" });

    await prismaAny.notification.update({ where: { id }, data: { isRead: true } });
    return res.status(200).json({ ok: true });
  }
);

// -------- Boost stub (no payments yet) --------
router.get(
  "/me/boost/status",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const flags = await prismaAny.teacherSubscriptionFlags.findUnique({ where: { teacherUserId } });
    const now = new Date();
    const activeUntil = flags?.boostActiveUntil ?? null;
    const isActive = activeUntil !== null && now <= activeUntil;
    return res.status(200).json({
      boost: {
        enabled: isActive,
        active_until: activeUntil ? activeUntil.toISOString() : null
      }
    });
  }
);

router.post(
  "/me/boost/activate",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const now = new Date();
    const boostExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Subscription is still required; boost is controlled via flags table (Phase 2).
    const sub = await prismaAny.teacherSubscription.findFirst({
      where: { teacherUserId },
      orderBy: { currentPeriodEndAt: "desc" }
    });
    if (!sub) return res.status(409).json({ error: "Subscription required" });

    await prismaAny.teacherSubscriptionFlags.upsert({
      where: { teacherUserId },
      update: { boostActiveUntil: boostExpiresAt },
      create: { teacherUserId, boostActiveUntil: boostExpiresAt }
    });

    // Keep these fields updated too (already in schema) for compatibility with earlier Phase 2 work.
    const updated = await prismaAny.teacherSubscription.update({
      where: { id: sub.id },
      data: { boostEnabled: true, boostExpiresAt } as any
    });

    return res.status(200).json({
      boost: {
        enabled: !!updated.boostEnabled,
        active_until: boostExpiresAt.toISOString()
      }
    });
  }
);

export default router;


