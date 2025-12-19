import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db.ts";
import { hashPassword } from "../auth/password.ts";
import { signAccessToken } from "../auth/jwt.ts";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.ts";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Teachers (Phase 1)
 *
 * /teachers/register:
 *   post:
 *     tags: [Teachers (Phase 1)]
 *     summary: Register a teacher (Phase 1)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 *
 * /teachers/subscribe:
 *   post:
 *     tags: [Teachers (Phase 1)]
 *     summary: Create subscription stub (Phase 1)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /teachers/me/profile:
 *   get:
 *     tags: [Teachers (Phase 1)]
 *     summary: Get own teacher profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /teachers/me/location:
 *   get:
 *     tags: [Teachers (Phase 1)]
 *     summary: Get own teacher location
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *
 * /teachers/me/availability:
 *   get:
 *     tags: [Teachers (Phase 1)]
 *     summary: Get own weekly availability
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 * /teachers/me/subscription:
 *   get:
 *     tags: [Teachers (Phase 1)]
 *     summary: Get own subscription and discoverability flags
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */

const availabilitySchema = z.object({
  mon: z.boolean(),
  tue: z.boolean(),
  wed: z.boolean(),
  thu: z.boolean(),
  fri: z.boolean(),
  sat: z.boolean(),
  sun: z.boolean()
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone_primary: z.string().optional(),
  profile: z.object({
    name: z.string().min(1),
    teaching_level: z.string().min(1),
    subjects_specialties: z.string().min(1),
    years_of_experience: z.number().int().nonnegative(),
    qualifications: z.string().min(1),
    profile_picture: z.string().min(1)
  }),
  location: z.object({
    country_code: z.string().length(2),
    postcode: z.string().min(1),
    radius_km: z.number().int().positive()
  }),
  weekly_availability: availabilitySchema
});

function getTodayDayOfWeekMon1Sun7(d = new Date()): number {
  // JS: 0=Sun..6=Sat => convert to 1=Mon..7=Sun
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function toAvailabilityRows(input: z.infer<typeof availabilitySchema>) {
  const map: Array<[number, boolean]> = [
    [1, input.mon],
    [2, input.tue],
    [3, input.wed],
    [4, input.thu],
    [5, input.fri],
    [6, input.sat],
    [7, input.sun]
  ];
  return map.map(([dayOfWeek, isAvailable]) => ({ dayOfWeek, isAvailable }));
}

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const { email, password, phone_primary, profile, location, weekly_availability } = parsed.data;
  const passwordHash = await hashPassword(password);
  const availabilityRows = toAvailabilityRows(weekly_availability);

  try {
    const user = await prisma.user.create({
      data: {
        role: "teacher",
        accountStatus: "active",
        email,
        phonePrimary: phone_primary ?? null,
        passwordHash,
        teacherProfile: {
          create: {
            name: profile.name,
            teachingLevel: profile.teaching_level,
            subjectsSpecialties: profile.subjects_specialties,
            yearsOfExperience: profile.years_of_experience,
            qualifications: profile.qualifications,
            profilePicture: profile.profile_picture
          }
        },
        teacherLocation: {
          create: {
            countryCode: location.country_code.toUpperCase(),
            postcode: location.postcode,
            radiusKm: location.radius_km
          }
        },
        teacherWeeklyAvailability: {
          create: availabilityRows
        }
      },
      include: {
        teacherProfile: true,
        teacherLocation: true,
        teacherWeeklyAvailability: true
      }
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const isAvailableToday = !!user.teacherWeeklyAvailability.find(
      (r: { dayOfWeek: number; isAvailable: boolean }) =>
        r.dayOfWeek === getTodayDayOfWeekMon1Sun7() && r.isAvailable
    );

    // No subscription created here -> not discoverable
    return res.status(201).json({
      accessToken,
      teacher: {
        id: user.id,
        email: user.email,
        phone_primary: user.phonePrimary,
        profile: user.teacherProfile,
        location: user.teacherLocation,
        weekly_availability: user.teacherWeeklyAvailability,
        is_discoverable_today: false,
        is_available_today: isAvailableToday
      }
    });
  } catch (e: any) {
    // Prisma unique constraint (email)
    if (e?.code === "P2002") return res.status(409).json({ error: "Email already in use" });
    return res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/subscribe",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;

    const now = new Date();
    const currentPeriodEndAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const gracePeriodEndAt = new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.teacherSubscription.create({
      data: {
        teacherUserId,
        currentPeriodEndAt,
        gracePeriodEndAt,
        overrideVisibleUntil: null
      }
    });

    const today = getTodayDayOfWeekMon1Sun7(now);
    const availability = await prisma.teacherWeeklyAvailability.findUnique({
      where: { teacherUserId_dayOfWeek: { teacherUserId, dayOfWeek: today } }
    });

    const isAvailableToday = !!availability?.isAvailable;
    const hasActiveSubscription = now <= subscription.gracePeriodEndAt;

    return res.status(201).json({
      subscription,
      is_available_today: isAvailableToday,
      is_discoverable_today: hasActiveSubscription && isAvailableToday
    });
  }
);

router.get(
  "/me/profile",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const profile = await prisma.teacherProfile.findUnique({ where: { teacherUserId } });
    if (!profile) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ profile });
  }
);

router.get(
  "/me/location",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const location = await prisma.teacherLocation.findUnique({ where: { teacherUserId } });
    if (!location) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ location });
  }
);

router.get(
  "/me/availability",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;
    const weeklyAvailability = await prisma.teacherWeeklyAvailability.findMany({
      where: { teacherUserId },
      orderBy: { dayOfWeek: "asc" }
    });
    return res.status(200).json({ weekly_availability: weeklyAvailability });
  }
);

router.get(
  "/me/subscription",
  requireAuth,
  requireRole("teacher"),
  async (req: AuthenticatedRequest, res: Response) => {
    const teacherUserId = req.auth!.userId;

    const subscription = await prisma.teacherSubscription.findFirst({
      where: { teacherUserId },
      orderBy: { currentPeriodEndAt: "desc" }
    });

    if (!subscription) return res.status(404).json({ error: "Not found" });

    const now = new Date();
    const today = getTodayDayOfWeekMon1Sun7(now);
    const availability = await prisma.teacherWeeklyAvailability.findUnique({
      where: { teacherUserId_dayOfWeek: { teacherUserId, dayOfWeek: today } }
    });

    const isAvailableToday = !!availability?.isAvailable;
    const hasActiveSubscription =
      now <= subscription.gracePeriodEndAt ||
      (subscription.overrideVisibleUntil !== null && now <= subscription.overrideVisibleUntil);

    return res.status(200).json({
      subscription,
      is_available_today: isAvailableToday,
      is_discoverable_today: hasActiveSubscription && isAvailableToday
    });
  }
);

export default router;
