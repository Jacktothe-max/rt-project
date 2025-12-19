import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Enterprise
 *
 * /v3/enterprise-schools:
 *   post:
 *     tags: [Enterprise]
 *     summary: Create an enterprise school (admin only)
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
 * /v3/enterprise-schools/{enterpriseSchoolId}:
 *   get:
 *     tags: [Enterprise]
 *     summary: Get enterprise school (admin or member)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: enterpriseSchoolId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /v3/enterprise-schools/{enterpriseSchoolId}/members/{schoolUserId}:
 *   put:
 *     tags: [Enterprise]
 *     summary: Add/update enterprise member (admin/member role)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: enterpriseSchoolId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: schoolUserId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Enterprise]
 *     summary: Remove enterprise member
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: enterpriseSchoolId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: schoolUserId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /v3/enterprise-schools/{enterpriseSchoolId}/reports/summary:
 *   get:
 *     tags: [Enterprise]
 *     summary: Enterprise summary report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: enterpriseSchoolId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /v3/enterprise-schools/{enterpriseSchoolId}/notifications/batch:
 *   post:
 *     tags: [Enterprise]
 *     summary: Create batch notifications for enterprise members
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: enterpriseSchoolId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /v3/enterprise-schools/{enterpriseSchoolId}/teachers:
 *   get:
 *     tags: [Enterprise]
 *     summary: Bulk teacher search (enterprise-wide)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: enterpriseSchoolId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: country_code
 *         required: false
 *         schema: { type: string, example: "AU" }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */

async function getEnterpriseMembershipOrNull(input: { enterpriseSchoolId: string; userId: string }) {
  return await prismaAny.enterpriseSchoolMember.findUnique({
    where: { enterpriseSchoolId_schoolUserId: { enterpriseSchoolId: input.enterpriseSchoolId, schoolUserId: input.userId } }
  });
}

function requireEnterpriseAccess(level: "member" | "admin") {
  return async (req: AuthenticatedRequest, res: Response, next: Function) => {
    // Admin users always allowed
    if (req.auth?.role === "admin") return next();

    if (req.auth?.role !== "school") return res.status(403).json({ error: "Forbidden" });

    const enterpriseSchoolId = req.params.enterpriseSchoolId;
    if (!enterpriseSchoolId) return res.status(400).json({ error: "Invalid request" });

    const membership = await getEnterpriseMembershipOrNull({ enterpriseSchoolId, userId: req.auth.userId });
    if (!membership) return res.status(403).json({ error: "Forbidden" });
    if (level === "admin" && membership.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    return next();
  };
}

// Enterprise schools CRUD (scaffold)
router.post(
  "/enterprise-schools",
  requireAuth,
  requireRole("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      name: z.string().min(1),
      country_code: z.string().length(2).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const created = await prismaAny.enterpriseSchool.create({
      data: { name: parsed.data.name, countryCode: (parsed.data.country_code as any) ?? null }
    });
    return res.status(201).json({ enterprise_school: created });
  }
);

router.get(
  "/enterprise-schools/:enterpriseSchoolId",
  requireAuth,
  requireEnterpriseAccess("member"),
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.enterpriseSchoolId;
    const school = await prismaAny.enterpriseSchool.findUnique({
      where: { id },
      include: { members: true }
    });
    if (!school) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ enterprise_school: school });
  }
);

// Membership management (admin-only scaffold)
router.put(
  "/enterprise-schools/:enterpriseSchoolId/members/:schoolUserId",
  requireAuth,
  requireEnterpriseAccess("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({ role: z.enum(["admin", "member"]).optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const enterpriseSchoolId = req.params.enterpriseSchoolId;
    const schoolUserId = req.params.schoolUserId;

    // Ensure target user is a school account
    const u = await prismaAny.user.findFirst({ where: { id: schoolUserId, role: "school" }, select: { id: true } });
    if (!u) return res.status(404).json({ error: "Not found" });

    await prismaAny.enterpriseSchoolMember.upsert({
      where: { enterpriseSchoolId_schoolUserId: { enterpriseSchoolId, schoolUserId } },
      update: { role: (parsed.data.role as any) ?? undefined },
      create: { enterpriseSchoolId, schoolUserId, role: (parsed.data.role as any) ?? "member" }
    });

    return res.status(200).json({ ok: true });
  }
);

router.delete(
  "/enterprise-schools/:enterpriseSchoolId/members/:schoolUserId",
  requireAuth,
  requireEnterpriseAccess("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const enterpriseSchoolId = req.params.enterpriseSchoolId;
    const schoolUserId = req.params.schoolUserId;
    await prismaAny.enterpriseSchoolMember.deleteMany({ where: { enterpriseSchoolId, schoolUserId } });
    return res.status(200).json({ ok: true });
  }
);

// Enterprise bulk endpoints (implemented minimal)
router.get(
  "/enterprise-schools/:enterpriseSchoolId/reports/summary",
  requireAuth,
  requireEnterpriseAccess("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const enterpriseSchoolId = req.params.enterpriseSchoolId;
    const members = await prismaAny.enterpriseSchoolMember.findMany({
      where: { enterpriseSchoolId },
      select: { schoolUserId: true, role: true }
    });

    const memberSchoolIds = members.map((m: any) => m.schoolUserId);
    const favouritesCount = await prismaAny.schoolFavourite.count({
      where: { schoolUserId: { in: memberSchoolIds } }
    });

    const notificationsCount = await prismaAny.notification.count({
      where: { userId: { in: memberSchoolIds } }
    });

    return res.status(200).json({
      enterprise_school_id: enterpriseSchoolId,
      member_count: members.length,
      favourites_count: favouritesCount,
      notifications_count: notificationsCount
    });
  }
);

router.post(
  "/enterprise-schools/:enterpriseSchoolId/notifications/batch",
  requireAuth,
  requireEnterpriseAccess("admin"),
  async (req: AuthenticatedRequest, res: Response) => {
    const enterpriseSchoolId = req.params.enterpriseSchoolId;
    const schema = z.object({
      type: z.enum(["job_alert", "system_alert"]).default("system_alert")
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

    const members = await prismaAny.enterpriseSchoolMember.findMany({
      where: { enterpriseSchoolId },
      select: { schoolUserId: true }
    });

    if (members.length === 0) return res.status(200).json({ created: 0 });

    await prismaAny.notification.createMany({
      data: members.map((m: any) => ({
        userId: m.schoolUserId,
        type: parsed.data.type,
        isRead: false
      }))
    });

    return res.status(201).json({ created: members.length });
  }
);

// Bulk teacher search (enterprise-wide) - minimal discoverable list, country-aware (optional)
router.get(
  "/enterprise-schools/:enterpriseSchoolId/teachers",
  requireAuth,
  requireEnterpriseAccess("member"),
  async (req: AuthenticatedRequest, res: Response) => {
    const enterpriseSchoolId = req.params.enterpriseSchoolId;
    const countryCode =
      typeof req.query.country_code === "string" ? req.query.country_code.toUpperCase() : null;

    const now = new Date();
    const todayDayOfWeek = (() => {
      const js = now.getDay();
      return js === 0 ? 7 : js;
    })();
    const dateOnly = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);

    // Determine enterprise country if not explicitly specified
    const ent = await prismaAny.enterpriseSchool.findUnique({
      where: { id: enterpriseSchoolId },
      select: { countryCode: true }
    });
    const effectiveCountry = countryCode ?? (ent?.countryCode ? String(ent.countryCode).toUpperCase() : null);
    if (!effectiveCountry) return res.status(400).json({ error: "country_code required" });

    const teachers = await prismaAny.user.findMany({
      where: {
        role: "teacher",
        accountStatus: "active",
        teacherLocation: { is: { countryCode: effectiveCountry } },
        teacherSubscriptions: {
          some: {
            OR: [
              { gracePeriodEndAt: { gte: now } },
              { overrideVisibleUntil: { not: null, gte: now } }
            ]
          }
        },
        OR: [
          { teacherAvailabilityCalendar: { some: { date: dateOnly, isAvailable: true } } },
          { teacherWeeklyAvailability: { some: { dayOfWeek: todayDayOfWeek, isAvailable: true } } }
        ]
      },
      take: 200,
      select: {
        id: true,
        teacherProfile: { select: { name: true, profilePicture: true, teachingLevel: true } },
        teacherLocation: { select: { postcode: true, radiusKm: true, countryCode: true } },
        teacherSubscriptionFlags: { select: { boostActiveUntil: true } },
        teacherSubscriptions: {
          orderBy: { currentPeriodEndAt: "desc" },
          take: 1,
          select: { tier: true }
        }
      }
    });

    const out = (teachers as any[])
      .filter((t: any) => t.teacherProfile && t.teacherLocation)
      .map((t: any) => {
        const tier = t.teacherSubscriptions?.[0]?.tier ?? "basic";
        const isPriority = String(tier) === "pro";
        const isBoosted = !!(t.teacherSubscriptionFlags?.boostActiveUntil && now <= t.teacherSubscriptionFlags.boostActiveUntil);
        return {
          teacherUserId: t.id,
          name: t.teacherProfile.name,
          teaching_level: t.teacherProfile.teachingLevel,
          profile_picture_url: t.teacherProfile.profilePicture,
          location: {
            country_code: String(t.teacherLocation.countryCode).toUpperCase(),
            postcode: t.teacherLocation.postcode,
            radius_km: t.teacherLocation.radiusKm
          },
          subscription_tier: tier,
          is_priority: isPriority,
          is_boosted: isBoosted
        };
      })
      .sort((a: any, b: any) => {
        const k = Number(b.is_boosted) - Number(a.is_boosted);
        if (k !== 0) return k;
        const p = Number(b.is_priority) - Number(a.is_priority);
        if (p !== 0) return p;
        return String(a.teacherUserId).localeCompare(String(b.teacherUserId));
      });

    return res.status(200).json({ enterprise_school_id: enterpriseSchoolId, country_code: effectiveCountry, teachers: out });
  }
);

export default router;


