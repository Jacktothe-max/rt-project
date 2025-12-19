import { z } from "zod";

const TeacherListItemSchema = z.object({
  teacherUserId: z.string(),
  name: z.string(),
  profile_picture_url: z.string(),
  teaching_level: z.string(),
  location: z.object({
    postcode: z.string(),
    radius_km: z.number(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable()
  })
});

export type TeacherListItem = z.infer<typeof TeacherListItemSchema>;

const TeachersListResponseSchema = z.object({
  teachers: z.array(TeacherListItemSchema)
});

const TeacherDetailSchema = z.object({
  teacherUserId: z.string(),
  profile: z.object({
    name: z.string(),
    teaching_level: z.string(),
    subjects_specialties: z.string(),
    years_of_experience: z.number(),
    qualifications: z.string(),
    profile_picture: z.string()
  }),
  contact: z.object({
    email_relay: z.string(),
    phone_primary: z.string().nullable()
  })
});

export type TeacherDetail = z.infer<typeof TeacherDetailSchema>;

function getSchoolToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("school_access_token");
}

export async function fetchDiscoverableTeachers(): Promise<TeacherListItem[]> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");

  const res = await fetch("/backend/schools/teachers", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const json = await res.json();
  const parsed = TeachersListResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.teachers;
}

export async function fetchTeacherDetail(teacherUserId: string): Promise<TeacherDetail> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");

  const res = await fetch(`/backend/schools/teachers/${encodeURIComponent(teacherUserId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const json = await res.json();
  const parsed = TeacherDetailSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data;
}


