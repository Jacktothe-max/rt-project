import { z } from "zod";

function getSchoolToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("school_access_token");
}

function getTeacherToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("teacher_access_token");
}

// -------- Map v2 teachers list (includes boost flag) --------
const TeacherListV2ItemSchema = z.object({
  teacherUserId: z.string(),
  name: z.string(),
  profile_picture_url: z.string(),
  teaching_level: z.string(),
  location: z.object({
    postcode: z.string(),
    radius_km: z.number(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable()
  }),
  is_boosted: z.boolean()
});

export type TeacherListV2Item = z.infer<typeof TeacherListV2ItemSchema>;

const TeachersListV2ResponseSchema = z.object({
  teachers: z.array(TeacherListV2ItemSchema),
  date: z.string()
});

export async function fetchDiscoverableTeachersV2(input?: {
  date?: string;
  origin_postcode?: string;
  max_distance_km?: number;
}): Promise<TeacherListV2Item[]> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");

  const qs = new URLSearchParams();
  if (input?.date) qs.set("date", input.date);
  if (input?.origin_postcode) qs.set("origin_postcode", input.origin_postcode);
  if (typeof input?.max_distance_km === "number") qs.set("max_distance_km", String(input.max_distance_km));
  const url = qs.toString() ? `/backend/schools/v2/teachers?${qs.toString()}` : "/backend/schools/v2/teachers";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = TeachersListV2ResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.teachers;
}

// -------- Favourites --------
const FavouriteItemSchema = z.object({
  teacherUserId: z.string(),
  name: z.string(),
  profile_picture_url: z.string(),
  teaching_level: z.string()
});
export type FavouriteItem = z.infer<typeof FavouriteItemSchema>;

const FavouritesResponseSchema = z.object({ favourites: z.array(FavouriteItemSchema) });

export async function fetchSchoolFavourites(): Promise<FavouriteItem[]> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const res = await fetch("/backend/schools/v2/favourites", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = FavouritesResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.favourites;
}

export async function addSchoolFavourite(teacherUserId: string): Promise<void> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const res = await fetch(`/backend/schools/v2/favourites/${encodeURIComponent(teacherUserId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

export async function removeSchoolFavourite(teacherUserId: string): Promise<void> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const res = await fetch(`/backend/schools/v2/favourites/${encodeURIComponent(teacherUserId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

// -------- Notifications --------
const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  read_status: z.enum(["read", "unread"]),
  timestamp: z.string()
});
export type NotificationItem = z.infer<typeof NotificationSchema>;

const NotificationsResponseSchema = z.object({ notifications: z.array(NotificationSchema) });

export async function fetchSchoolNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const url = unreadOnly ? "/backend/schools/v2/me/notifications?unread=true" : "/backend/schools/v2/me/notifications";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = NotificationsResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.notifications;
}

export async function markSchoolNotificationRead(id: string): Promise<void> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const res = await fetch(`/backend/schools/v2/me/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

export async function fetchTeacherNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const url = unreadOnly ? "/backend/teachers/v2/me/notifications?unread=true" : "/backend/teachers/v2/me/notifications";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = NotificationsResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.notifications;
}

export async function markTeacherNotificationRead(id: string): Promise<void> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch(`/backend/teachers/v2/me/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

// -------- Teacher availability calendar --------
const CalendarEntrySchema = z.object({ date: z.string(), is_available: z.boolean() });
export type CalendarEntry = z.infer<typeof CalendarEntrySchema>;

const CalendarGetResponseSchema = z.object({ availability: z.array(CalendarEntrySchema) });

export async function fetchTeacherCalendar(from: string, to: string): Promise<CalendarEntry[]> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch(
    `/backend/teachers/v2/me/availability-calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = CalendarGetResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.availability;
}

export async function upsertTeacherCalendar(entries: CalendarEntry[]): Promise<void> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch("/backend/teachers/v2/me/availability-calendar", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ dates: entries })
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

// -------- Boost stub --------
const BoostResponseSchema = z.object({ boost: z.object({ enabled: z.boolean(), active_until: z.string().nullable() }) });
export type BoostStatus = z.infer<typeof BoostResponseSchema>["boost"];

export async function activateTeacherBoost(): Promise<BoostStatus> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch("/backend/teachers/v2/me/boost/activate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = BoostResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.boost;
}

export async function fetchTeacherBoostStatus(): Promise<BoostStatus> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch("/backend/teachers/v2/me/boost/status", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = BoostResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.boost;
}


