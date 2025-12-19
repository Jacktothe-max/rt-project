import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../db.ts";
import { requireAuth, type AuthenticatedRequest } from "../../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Messaging
 *
 * /v3/messages:
 *   post:
 *     tags: [Messaging]
 *     summary: Send a message (Phase 3)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /v3/messages/inbox:
 *   get:
 *     tags: [Messaging]
 *     summary: List inbox messages
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *
 * /v3/messages/sent:
 *   get:
 *     tags: [Messaging]
 *     summary: List sent messages
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *
 * /v3/messages/{id}/read:
 *   post:
 *     tags: [Messaging]
 *     summary: Mark a received message as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       404: { description: Not found }
 */

function getDayOfWeekMon1Sun7(d = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function toISODateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Phase 3: send a message (scaffold)
router.post("/messages", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    receiver_id: z.string().uuid(),
    content: z.string().min(1).max(5000),
    // Required for school -> teacher messaging enforcement (country-aware).
    country_code: z.string().length(2).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const senderId = req.auth!.userId;
  const senderRole = req.auth!.role;
  const receiverId = parsed.data.receiver_id;
  const countryCode = parsed.data.country_code ? parsed.data.country_code.toUpperCase() : null;

  const sender = await prismaAny.user.findUnique({
    where: { id: senderId },
    select: { id: true, accountStatus: true, role: true }
  });
  if (!sender || sender.accountStatus !== "active") return res.status(403).json({ error: "Forbidden" });

  const receiver = await prismaAny.user.findUnique({
    where: { id: receiverId },
    select: { id: true, accountStatus: true, role: true }
  });
  if (!receiver) return res.status(404).json({ error: "Not found" });
  if (receiver.accountStatus !== "active") return res.status(404).json({ error: "Not found" });

  // Enforce discoverability & country rules for school -> teacher messaging
  if (senderRole === "school" && receiver.role === "teacher") {
    if (!countryCode) return res.status(400).json({ error: "country_code required" });

    const now = new Date();
    const dayOfWeek = getDayOfWeekMon1Sun7(now);
    const dateOnly = new Date(`${toISODateOnly(now)}T00:00:00.000Z`);

    const t = await prismaAny.user.findFirst({
      where: { id: receiverId, role: "teacher", accountStatus: "active" },
      select: {
        teacherLocation: { select: { countryCode: true } },
        teacherWeeklyAvailability: { where: { dayOfWeek }, select: { isAvailable: true } },
        teacherAvailabilityCalendar: { where: { date: dateOnly }, select: { isAvailable: true } },
        teacherSubscriptions: {
          where: {
            OR: [
              { gracePeriodEndAt: { gte: now } },
              { overrideVisibleUntil: { not: null, gte: now } }
            ]
          },
          take: 1,
          select: { id: true }
        }
      }
    });

    const countryOk =
      !!t?.teacherLocation && String(t.teacherLocation.countryCode).toUpperCase() === countryCode;
    const hasActiveSub = (t?.teacherSubscriptions?.length ?? 0) > 0;
    const cal = t?.teacherAvailabilityCalendar?.[0]?.isAvailable;
    const weekly = t?.teacherWeeklyAvailability?.[0]?.isAvailable ?? false;
    const available = (cal ?? weekly) === true;

    if (!(countryOk && hasActiveSub && available)) return res.status(403).json({ error: "Forbidden" });
  }

  const msg = await prismaAny.message.create({
    data: { senderId, receiverId, content: parsed.data.content }
  });
  return res.status(201).json({ message: msg });
});

// Inbox (received)
router.get("/messages/inbox", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const rows = await prismaAny.message.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return res.status(200).json({ messages: rows });
});

// Sent
router.get("/messages/sent", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const rows = await prismaAny.message.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return res.status(200).json({ messages: rows });
});

// Mark read
router.post("/messages/:id/read", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId;
  const id = req.params.id;
  const msg = await prismaAny.message.findFirst({ where: { id, receiverId: userId } });
  if (!msg) return res.status(404).json({ error: "Not found" });
  await prismaAny.message.update({ where: { id }, data: { readAt: new Date() } });
  return res.status(200).json({ ok: true });
});

export default router;


