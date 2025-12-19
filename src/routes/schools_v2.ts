import { Router, type Response } from "express";
import { prisma } from "../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.ts";

const router = Router();
const prismaAny = prisma as any;

/**
 * @openapi
 * tags:
 *   - name: Schools (Phase 2)
 *
 * /schools/v2/teachers:
 *   get:
 *     tags: [Schools (Phase 2)]
 *     summary: List discoverable teachers (Phase 2; includes boost flag and optional distance filtering)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema: { type: string, example: "2025-01-01" }
 *       - in: query
 *         name: origin_postcode
 *         required: false
 *         schema: { type: string }
 *       - in: query
 *         name: max_distance_km
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /schools/v2/teachers/{teacherUserId}:
 *   get:
 *     tags: [Schools (Phase 2)]
 *     summary: Get discoverable teacher detail (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teacherUserId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: false
 *         schema: { type: string, example: "2025-01-01" }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /schools/v2/favourites:
 *   get:
 *     tags: [Schools (Phase 2)]
 *     summary: List favourite teachers (Phase 2; only currently discoverable favourites returned)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /schools/v2/favourites/{teacherUserId}:
 *   put:
 *     tags: [Schools (Phase 2)]
 *     summary: Add a favourite teacher (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teacherUserId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Schools (Phase 2)]
 *     summary: Remove a favourite teacher (Phase 2)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: teacherUserId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /schools/v2/me/notifications:
 *   get:
 *     tags: [Schools (Phase 2)]
 *     summary: List school notifications (Phase 2)
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
 * /schools/v2/me/notifications/{id}/read:
 *   post:
 *     tags: [Schools (Phase 2)]
 *     summary: Mark school notification as read (Phase 2)
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
 */

function getTodayDayOfWeekMon1Sun7(d = new Date()): number {
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

// Phase 2 placeholder distance calc: deterministic postcode -> coords (same style as frontend fakeGeocode)
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fakeGeocode(postcode: string, salt = ""): { latitude: number; longitude: number } {
  const h1 = hashString(`${postcode}|${salt}|lat`);
  const h2 = hashString(`${postcode}|${salt}|lng`);
  const lat = ((h1 % 120000) / 1000 - 60);
  const lng = ((h2 % 360000) / 1000 - 180);
  return { latitude: lat, longitude: lng };
}

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function isTeacherDiscoverableOnDate(teacherUserId: string, date: Date): Promise<boolean> {
  const now = new Date();
  const dateOnly = new Date(`${toISODateOnly(date)}T00:00:00.000Z`);
  const dayOfWeek = getTodayDayOfWeekMon1Sun7(date);

  const teacher = await prismaAny.user.findFirst({
    where: { id: teacherUserId, role: "teacher", accountStatus: "active" },
    select: {
      teacherWeeklyAvailability: {
        where: { dayOfWeek },
        select: { isAvailable: true }
      },
      teacherAvailabilityCalendar: {
        where: { date: dateOnly },
        select: { isAvailable: true }
      },
      teacherSubscriptionFlags: {
        select: { boostActiveUntil: true }
      },
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

  if (!teacher) return false;
  const hasActiveSubscription = teacher.teacherSubscriptions.length > 0;
  const cal = teacher.teacherAvailabilityCalendar[0]?.isAvailable;
  const weekly = teacher.teacherWeeklyAvailability[0]?.isAvailable ?? false;
  const isAvailable = cal ?? weekly; // Phase 2 uses calendar when present, otherwise weekly fallback
  return hasActiveSubscription && isAvailable;
}

// -------- Teachers list for map (Phase 2: boosted highlighting/sorting) --------
router.get(
  "/teachers",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const now = new Date();
    const date = typeof req.query.date === "string" ? parseISODateOnly(req.query.date) : null;
    const effectiveDate = date ?? now;
    const todayDayOfWeek = getTodayDayOfWeekMon1Sun7(effectiveDate);
    const dateOnly = new Date(`${toISODateOnly(effectiveDate)}T00:00:00.000Z`);

    // Optional Phase 2 distance filter (placeholder geocoding; replace with real geocoding later).
    const originPostcode = typeof req.query.origin_postcode === "string" ? req.query.origin_postcode : null;
    const maxDistanceKm =
      typeof req.query.max_distance_km === "string" ? Number(req.query.max_distance_km) : null;
    const hasDistanceFilter =
      originPostcode !== null && maxDistanceKm !== null && Number.isFinite(maxDistanceKm) && maxDistanceKm > 0;
    const originCoords = hasDistanceFilter ? fakeGeocode(originPostcode!, "origin") : null;

    // Get teachers with active subs + availability (calendar OR weekly).
    const teachers = await prismaAny.user.findMany({
      where: {
        role: "teacher",
        accountStatus: "active",
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
      select: {
        id: true,
        teacherProfile: { select: { name: true, profilePicture: true, teachingLevel: true } },
        teacherLocation: { select: { postcode: true, radiusKm: true } },
        teacherSubscriptionFlags: { select: { boostActiveUntil: true } }
      }
    });

    const results = (teachers as any[])
      .filter((t: any) => t.teacherProfile && t.teacherLocation)
      .map((t: any) => ({
        teacherUserId: t.id,
        name: t.teacherProfile!.name,
        profile_picture_url: t.teacherProfile!.profilePicture,
        teaching_level: t.teacherProfile!.teachingLevel,
        location: {
          postcode: t.teacherLocation!.postcode,
          radius_km: t.teacherLocation!.radiusKm,
          latitude: null as null,
          longitude: null as null
        },
        is_boosted: !!(t.teacherSubscriptionFlags?.boostActiveUntil && now <= t.teacherSubscriptionFlags.boostActiveUntil)
      }))
      .filter((t: any) => {
        if (!hasDistanceFilter || !originCoords) return true;
        const teacherCoords = fakeGeocode(t.location.postcode, t.teacherUserId);
        const dist = haversineKm(originCoords, teacherCoords);
        return dist <= (maxDistanceKm as number);
      })
      .sort((a: any, b: any) => Number(b.is_boosted) - Number(a.is_boosted));

    return res.status(200).json({ teachers: results, date: toISODateOnly(effectiveDate) });
  }
);

// -------- Teacher detail (Phase 2 version: still 404 if not discoverable) --------
router.get(
  "/teachers/:teacherUserId",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.params.teacherUserId;
    if (!teacherUserId) return res.status(400).json({ error: "Invalid request" });

    const now = new Date();
    const date = typeof req.query.date === "string" ? parseISODateOnly(req.query.date) : null;
    const effectiveDate = date ?? now;

    const discoverable = await isTeacherDiscoverableOnDate(teacherUserId, effectiveDate);
    if (!discoverable) return res.status(404).json({ error: "Not found" });

    const teacher = await prisma.user.findFirst({
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
      contact: {
        email_relay: emailRelay,
        phone_primary: teacher.phonePrimary ?? null
      }
    });
  }
);

// -------- Favourites (Phase 2) --------
router.get(
  "/favourites",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolUserId = req.auth!.userId;
    const now = new Date();
    const today = getTodayDayOfWeekMon1Sun7(now);

    const favourites = await prismaAny.schoolFavourite.findMany({
      where: { schoolUserId },
      orderBy: { createdAt: "desc" },
      select: {
        teacherUserId: true,
        teacher: {
          select: {
            accountStatus: true,
            teacherProfile: { select: { name: true, profilePicture: true, teachingLevel: true } },
            teacherLocation: { select: { postcode: true, radiusKm: true } },
            teacherWeeklyAvailability: { where: { dayOfWeek: today }, select: { isAvailable: true } },
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
        }
      }
    });

    // Keep visibility rules strict: only return favourites that are currently discoverable.
    const results = (favourites as any[])
      .filter((f: any) => {
        const t = f.teacher;
        if (!t || t.accountStatus !== "active") return false;
        const hasSub = t.teacherSubscriptions.length > 0;
        const available = !!t.teacherWeeklyAvailability[0]?.isAvailable;
        return hasSub && available && !!t.teacherProfile && !!t.teacherLocation;
      })
      .map((f: any) => ({
        teacherUserId: f.teacherUserId,
        name: f.teacher!.teacherProfile!.name,
        profile_picture_url: f.teacher!.teacherProfile!.profilePicture,
        teaching_level: f.teacher!.teacherProfile!.teachingLevel
      }));

    return res.status(200).json({ favourites: results });
  }
);

router.put(
  "/favourites/:teacherUserId",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolUserId = req.auth!.userId;
    const teacherUserId = req.params.teacherUserId;
    if (!teacherUserId) return res.status(400).json({ error: "Invalid request" });

    // Only allow favouriting discoverable teachers (keeps Phase 1 visibility rules strict).
    const discoverable = await isTeacherDiscoverableOnDate(teacherUserId, new Date());
    if (!discoverable) return res.status(404).json({ error: "Not found" });

    await prismaAny.schoolFavourite.upsert({
      where: { schoolUserId_teacherUserId: { schoolUserId, teacherUserId } },
      update: {},
      create: { schoolUserId, teacherUserId }
    });

    return res.status(200).json({ ok: true });
  }
);

router.delete(
  "/favourites/:teacherUserId",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolUserId = req.auth!.userId;
    const teacherUserId = req.params.teacherUserId;
    if (!teacherUserId) return res.status(400).json({ error: "Invalid request" });

    await prismaAny.schoolFavourite.deleteMany({ where: { schoolUserId, teacherUserId } });
    return res.status(200).json({ ok: true });
  }
);

// -------- Notifications (Phase 2) --------
router.get(
  "/me/notifications",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolUserId = req.auth!.userId;
    const unreadOnly = req.query.unread === "true";

    const rows = await prismaAny.notification.findMany({
      where: { userId: schoolUserId, ...(unreadOnly ? { isRead: false } : {}) },
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
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolUserId = req.auth!.userId;
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Invalid request" });

    const n = await prismaAny.notification.findFirst({ where: { id, userId: schoolUserId } });
    if (!n) return res.status(404).json({ error: "Not found" });

    await prismaAny.notification.update({ where: { id }, data: { isRead: true } });
    return res.status(200).json({ ok: true });
  }
);

export default router;


