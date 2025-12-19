import { Router, type Response } from "express";
import { prisma } from "../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Schools (Phase 3)
 *
 * /schools/v3/teachers:
 *   get:
 *     tags: [Schools (Phase 3)]
 *     summary: List discoverable teachers (Phase 3; country-aware, includes priority/boost flags)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: country_code
 *         required: true
 *         schema: { type: string, example: "AU" }
 *       - in: query
 *         name: date
 *         required: false
 *         schema: { type: string, example: "2025-01-01" }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /schools/v3/teachers/{teacherUserId}:
 *   get:
 *     tags: [Schools (Phase 3)]
 *     summary: Get discoverable teacher detail (Phase 3; country-aware)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teacherUserId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: country_code
 *         required: true
 *         schema: { type: string, example: "AU" }
 *       - in: query
 *         name: date
 *         required: false
 *         schema: { type: string, example: "2025-01-01" }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */

function getDayOfWeekMon1Sun7(d = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function toISODateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseISODateOnly(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const d = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function isTeacherDiscoverableV3(opts: { teacherUserId: string; effectiveDate: Date; countryCode: string }) {
  const now = new Date();
  const dateOnly = new Date(`${toISODateOnly(opts.effectiveDate)}T00:00:00.000Z`);
  const dayOfWeek = getDayOfWeekMon1Sun7(opts.effectiveDate);

  const teacher = await prismaAny.user.findFirst({
    where: { id: opts.teacherUserId, role: "teacher", accountStatus: "active" },
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

  if (!teacher?.teacherLocation) return false;
  if (String(teacher.teacherLocation.countryCode).toUpperCase() !== opts.countryCode) return false;

  const hasActiveSubscription = teacher.teacherSubscriptions.length > 0;
  const cal = teacher.teacherAvailabilityCalendar[0]?.isAvailable;
  const weekly = teacher.teacherWeeklyAvailability[0]?.isAvailable ?? false;
  const isAvailable = cal ?? weekly; // Phase 2/3 rule: calendar overrides weekly if present

  return hasActiveSubscription && isAvailable;
}

// Phase 3: country-aware teacher list (discoverable only), with pro/boost ordering
router.get(
  "/teachers",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const countryCode =
      typeof req.query.country_code === "string" ? req.query.country_code.toUpperCase() : null;
    if (!countryCode || countryCode.length !== 2) return res.status(400).json({ error: "Invalid request" });

    const now = new Date();
    const date = typeof req.query.date === "string" ? parseISODateOnly(req.query.date) : null;
    const effectiveDate = date ?? now;
    const dayOfWeek = getDayOfWeekMon1Sun7(effectiveDate);
    const dateOnly = new Date(`${toISODateOnly(effectiveDate)}T00:00:00.000Z`);

    // Country-aware filter is enforced via teacherLocation.countryCode.
    const rows = await prismaAny.user.findMany({
      where: {
        role: "teacher",
        accountStatus: "active",
        teacherLocation: { is: { countryCode } },
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
          { teacherWeeklyAvailability: { some: { dayOfWeek, isAvailable: true } } }
        ]
      },
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

    const out = (rows as any[])
      .filter((t: any) => t.teacherProfile && t.teacherLocation)
      .map((t: any) => {
        const isBoosted = !!(t.teacherSubscriptionFlags?.boostActiveUntil && now <= t.teacherSubscriptionFlags.boostActiveUntil);
        const tier = t.teacherSubscriptions?.[0]?.tier ?? "basic";
        const isPro = String(tier) === "pro";
        return {
          teacherUserId: t.id,
          name: t.teacherProfile.name,
          profile_picture_url: t.teacherProfile.profilePicture,
          teaching_level: t.teacherProfile.teachingLevel,
          location: {
            country_code: String(t.teacherLocation.countryCode).toUpperCase(),
            postcode: t.teacherLocation.postcode,
            radius_km: t.teacherLocation.radiusKm,
            latitude: null as null,
            longitude: null as null
          },
          is_boosted: isBoosted,
          subscription_tier: tier,
          is_priority: isPro // Phase 3: priority visibility for Pro tier
        };
      })
      .sort((a: any, b: any) => {
        // Sort rule (Phase 3): boosted first, then priority (pro), then stable-ish by id.
        const k = Number(b.is_boosted) - Number(a.is_boosted);
        if (k !== 0) return k;
        const p = Number(b.is_priority) - Number(a.is_priority);
        if (p !== 0) return p;
        return String(a.teacherUserId).localeCompare(String(b.teacherUserId));
      });

    return res.status(200).json({ teachers: out, country_code: countryCode, date: toISODateOnly(effectiveDate) });
  }
);

// Phase 3: country-aware teacher detail (404 if not discoverable in that country/date)
router.get(
  "/teachers/:teacherUserId",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.params.teacherUserId;
    const countryCode =
      typeof req.query.country_code === "string" ? req.query.country_code.toUpperCase() : null;
    if (!teacherUserId || !countryCode || countryCode.length !== 2) return res.status(400).json({ error: "Invalid request" });

    const now = new Date();
    const date = typeof req.query.date === "string" ? parseISODateOnly(req.query.date) : null;
    const effectiveDate = date ?? now;

    const discoverable = await isTeacherDiscoverableV3({ teacherUserId, effectiveDate, countryCode });
    if (!discoverable) return res.status(404).json({ error: "Not found" });

    const flags = await prismaAny.teacherSubscriptionFlags.findUnique({ where: { teacherUserId } });
    const sub = await prismaAny.teacherSubscription.findFirst({
      where: { teacherUserId },
      orderBy: { currentPeriodEndAt: "desc" },
      select: { tier: true }
    });
    const tier = sub?.tier ?? "basic";
    const isPriority = String(tier) === "pro";
    const isBoosted = !!(flags?.boostActiveUntil && now <= flags.boostActiveUntil);

    const verifications = await prismaAny.credentialVerification.findMany({
      where: { teacherUserId },
      orderBy: { submittedAt: "desc" },
      select: { type: true, status: true, submittedAt: true, decidedAt: true }
    });

    // Reduce to latest status per credential type.
    const latestByType: Record<string, any> = {};
    for (const v of verifications as any[]) {
      const key = String(v.type);
      if (!latestByType[key]) latestByType[key] = v;
    }

    const teacher = await prismaAny.user.findFirst({
      where: { id: teacherUserId, role: "teacher", accountStatus: "active" },
      select: {
        id: true,
        phonePrimary: true,
        teacherProfile: {
          select: {
            name: true,
            teachingLevel: true,
            subjectsSpecialties: true,
            yearsOfExperience: true,
            qualifications: true,
            profilePicture: true
          }
        }
      }
    });
    if (!teacher?.teacherProfile) return res.status(404).json({ error: "Not found" });

    const emailRelay = `teacher+${teacher.id}@relay.invalid`;
    return res.status(200).json({
      teacherUserId: teacher.id,
      profile: {
        name: teacher.teacherProfile.name,
        teaching_level: teacher.teacherProfile.teachingLevel,
        subjects_specialties: teacher.teacherProfile.subjectsSpecialties,
        years_of_experience: teacher.teacherProfile.yearsOfExperience,
        qualifications: teacher.teacherProfile.qualifications,
        profile_picture: teacher.teacherProfile.profilePicture
      },
      subscription: {
        tier,
        is_priority: isPriority,
        is_boosted: isBoosted
      },
      credential_verification: {
        latest_by_type: Object.entries(latestByType).map(([type, v]) => ({
          type,
          status: String((v as any).status),
          submitted_at: (v as any).submittedAt ? new Date((v as any).submittedAt).toISOString() : null,
          decided_at: (v as any).decidedAt ? new Date((v as any).decidedAt).toISOString() : null
        }))
      },
      contact: {
        email_relay: emailRelay,
        phone_primary: teacher.phonePrimary ?? null
      }
    });
  }
);

export default router;


