import { Router, type Response } from "express";
import { prisma } from "../db.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.ts";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Schools (Phase 1)
 *
 * /schools/teachers:
 *   get:
 *     tags: [Schools (Phase 1)]
 *     summary: List discoverable teachers (map stub, Phase 1)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /schools/teachers/{teacherUserId}:
 *   get:
 *     tags: [Schools (Phase 1)]
 *     summary: Get a discoverable teacher detail (Phase 1)
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
 */

function getTodayDayOfWeekMon1Sun7(d = new Date()): number {
  // JS: 0=Sun..6=Sat => convert to 1=Mon..7=Sun
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

async function getDiscoverableTeacherOrNull(teacherUserId: string) {
  const now = new Date();
  const today = getTodayDayOfWeekMon1Sun7(now);

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherUserId,
      role: "teacher",
      accountStatus: "active"
    },
    select: {
      id: true,
      email: true,
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
      },
      teacherLocation: {
        select: {
          countryCode: true,
          postcode: true,
          radiusKm: true
        }
      },
      teacherWeeklyAvailability: {
        where: { dayOfWeek: today },
        select: { dayOfWeek: true, isAvailable: true }
      },
      teacherSubscriptions: {
        where: {
          OR: [
            { gracePeriodEndAt: { gte: now } },
            { overrideVisibleUntil: { not: null, gte: now } }
          ]
        },
        orderBy: [{ currentPeriodEndAt: "desc" }],
        take: 1,
        select: {
          id: true,
          currentPeriodEndAt: true,
          gracePeriodEndAt: true,
          overrideVisibleUntil: true
        }
      }
    }
  });

  if (!teacher) return null;

  const isAvailableToday = !!teacher.teacherWeeklyAvailability[0]?.isAvailable;
  const hasActiveSubscription = teacher.teacherSubscriptions.length > 0;

  if (!isAvailableToday || !hasActiveSubscription) return null;

  return teacher;
}

function nameFirstPlusLastInitial(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].slice(0, 1);
  return `${first} ${lastInitial}.`;
}

// GET /schools/teachers/:teacherUserId
// Returns minimal Phase 1 profile fields + contact info only if discoverable; else 404.
router.get(
  "/teachers/:teacherUserId",
  requireAuth,
  requireRole("school"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.params.teacherUserId;
    if (!teacherUserId) return res.status(400).json({ error: "Invalid request" });

    const teacher = await getDiscoverableTeacherOrNull(teacherUserId);
    if (!teacher?.teacherProfile) return res.status(404).json({ error: "Not found" });

    // Phase 1 email relay placeholder (actual relay service later).
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

// GET /schools/teachers (map stub)
// Returns all discoverable teachers with minimal fields only; no search/filtering logic.
router.get(
  "/teachers",
  requireAuth,
  requireRole("school"),
  async (_req: AuthenticatedRequest, res: Response) => {
    const now = new Date();
    const today = getTodayDayOfWeekMon1Sun7(now);

    type MapTeacherRow = {
      id: string;
      teacherProfile: { name: string; profilePicture: string; teachingLevel: string } | null;
      teacherLocation: { postcode: string; radiusKm: number } | null;
    };

    const teachers = (await prisma.user.findMany({
      where: {
        role: "teacher",
        accountStatus: "active",
        teacherWeeklyAvailability: {
          some: {
            dayOfWeek: today,
            isAvailable: true
          }
        },
        teacherSubscriptions: {
          some: {
            OR: [
              { gracePeriodEndAt: { gte: now } },
              { overrideVisibleUntil: { not: null, gte: now } }
            ]
          }
        }
      },
      select: {
        id: true,
        teacherProfile: {
          select: {
            name: true,
            profilePicture: true,
            teachingLevel: true
          }
        },
        teacherLocation: {
          select: {
            postcode: true,
            radiusKm: true
          }
        }
      }
    })) as MapTeacherRow[];

    const results = teachers
      .filter((t: MapTeacherRow) => t.teacherProfile && t.teacherLocation)
      .map((t: MapTeacherRow) => ({
        teacherUserId: t.id,
        name: nameFirstPlusLastInitial(t.teacherProfile!.name),
        profile_picture_url: t.teacherProfile!.profilePicture,
        teaching_level: t.teacherProfile!.teachingLevel,
        location: {
          postcode: t.teacherLocation!.postcode,
          radius_km: t.teacherLocation!.radiusKm,
          // Phase 1 placeholder for future geocoding.
          latitude: null as null,
          longitude: null as null
        }
      }));

    return res.status(200).json({ teachers: results });
  }
);

export default router;


