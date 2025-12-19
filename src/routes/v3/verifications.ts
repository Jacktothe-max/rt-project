import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Credential Verification
 *
 * /v3/teacher/me/credential-verifications:
 *   get:
 *     tags: [Credential Verification]
 *     summary: List own credential verifications (teacher)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *   post:
 *     tags: [Credential Verification]
 *     summary: Submit a credential verification (teacher)
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
 *
 * /v3/credential-verifications/{id}/decide:
 *   post:
 *     tags: [Credential Verification]
 *     summary: Decide a credential verification (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *       404: { description: Not found }
 */

// Teacher submits a credential verification request (scaffold)
router.post(
  "/teacher/me/credential-verifications",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      type: z.enum(["teacher_registration", "working_with_children", "other"]),
      notes: z.string().max(2000).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const teacherUserId = req.auth!.userId;
    const created = await prismaAny.credentialVerification.create({
      data: {
        teacherUserId,
        type: parsed.data.type as any,
        status: "submitted",
        notes: parsed.data.notes ?? null
      }
    });
    return res.status(201).json({ verification: created });
  }
);

router.get(
  "/teacher/me/credential-verifications",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const rows = await prismaAny.credentialVerification.findMany({
      where: { teacherUserId },
      orderBy: { submittedAt: "desc" }
    });
    return res.status(200).json({ verifications: rows });
  }
);

// Admin approves/rejects (scaffold)
router.post(
  "/credential-verifications/:id/decide",
  requireAuth,
  requireRole("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    const schema = z.object({
      status: z.enum(["approved", "rejected"]),
      notes: z.string().max(2000).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const existing = await prismaAny.credentialVerification.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updated = await prismaAny.credentialVerification.update({
      where: { id },
      data: {
        status: parsed.data.status as any,
        decidedAt: new Date(),
        notes: parsed.data.notes ?? existing.notes
      }
    });

    // Phase 3: notify teacher when verification status changes.
    await prismaAny.notification.create({
      data: {
        userId: existing.teacherUserId,
        type: "system_alert",
        isRead: false
      } as any
    });

    return res.status(200).json({ verification: updated });
  }
);

export default router;


