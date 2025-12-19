import { z } from "zod";

function getTeacherToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("teacher_access_token");
}

function getSchoolToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("school_access_token");
}

const SubscriptionSchema = z.object({
  tier: z.string(),
  country_code: z.string().nullable(),
  currency_code: z.string().nullable(),
  current_period_end_at: z.string(),
  grace_period_end_at: z.string()
});

export type SubscriptionInfo = z.infer<typeof SubscriptionSchema>;

export async function fetchTeacherSubscriptionV3(): Promise<SubscriptionInfo> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch("/backend/v3/teacher/me/subscription", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = z.object({ subscription: SubscriptionSchema }).safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.subscription;
}

export async function fetchSchoolSubscriptionV3(): Promise<SubscriptionInfo> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const res = await fetch("/backend/v3/school/me/subscription", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = z.object({ subscription: SubscriptionSchema }).safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.subscription;
}

// -------- Phase 3 country-aware school discovery --------
const TeacherListV3ItemSchema = z.object({
  teacherUserId: z.string(),
  name: z.string(),
  profile_picture_url: z.string(),
  teaching_level: z.string(),
  location: z.object({
    country_code: z.string(),
    postcode: z.string(),
    radius_km: z.number(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable()
  }),
  is_boosted: z.boolean(),
  subscription_tier: z.string(),
  is_priority: z.boolean()
});

export type TeacherListV3Item = z.infer<typeof TeacherListV3ItemSchema>;

const TeachersListV3ResponseSchema = z.object({
  teachers: z.array(TeacherListV3ItemSchema),
  country_code: z.string(),
  date: z.string()
});

export async function fetchDiscoverableTeachersV3(input: { country_code: string }): Promise<TeacherListV3Item[]> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const url = `/backend/schools/v3/teachers?country_code=${encodeURIComponent(input.country_code)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = TeachersListV3ResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.teachers;
}

export type CountryConfigPublic = {
  country_code: string;
  currency_code: string;
  legal_url: string | null;
  pricing_json: string | null;
};

export async function fetchCountryConfigsV3(): Promise<CountryConfigPublic[]> {
  // This endpoint requires auth; use school token (v3 map is school-facing).
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const res = await fetch("/backend/v3/configs", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const schema = z.object({
    countries: z.array(
      z.object({
        country_code: z.string(),
        currency_code: z.string(),
        legal_url: z.string().nullable(),
        pricing_json: z.string().nullable()
      })
    )
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data.countries;
}

// -------- Phase 3 teacher detail (country-aware) --------
const CredentialLatestSchema = z.object({
  type: z.string(),
  status: z.string(),
  submitted_at: z.string().nullable(),
  decided_at: z.string().nullable()
});

const TeacherDetailV3Schema = z.object({
  teacherUserId: z.string(),
  profile: z.object({
    name: z.string(),
    teaching_level: z.string(),
    subjects_specialties: z.string(),
    years_of_experience: z.number(),
    qualifications: z.string(),
    profile_picture: z.string()
  }),
  subscription: z.object({
    tier: z.string(),
    is_priority: z.boolean(),
    is_boosted: z.boolean()
  }),
  credential_verification: z.object({
    latest_by_type: z.array(CredentialLatestSchema)
  }),
  contact: z.object({
    email_relay: z.string(),
    phone_primary: z.string().nullable()
  })
});

export type TeacherDetailV3 = z.infer<typeof TeacherDetailV3Schema>;

export async function fetchTeacherDetailV3(input: {
  teacherUserId: string;
  country_code: string;
}): Promise<TeacherDetailV3> {
  const token = getSchoolToken();
  if (!token) throw new Error("Missing school access token");
  const url = `/backend/schools/v3/teachers/${encodeURIComponent(input.teacherUserId)}?country_code=${encodeURIComponent(
    input.country_code
  )}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  const parsed = TeacherDetailV3Schema.safeParse(json);
  if (!parsed.success) throw new Error("Invalid response shape");
  return parsed.data;
}

// -------- Phase 3 enterprise (admin scaffold) --------
function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("admin_access_token");
}

export async function createEnterpriseSchool(input: { name: string; country_code?: string | null }) {
  const token = getAdminToken();
  if (!token) throw new Error("Missing admin access token");
  const res = await fetch("/backend/v3/enterprise-schools", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: input.name, country_code: input.country_code ?? undefined })
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return await res.json();
}

export async function getEnterpriseSchool(enterpriseSchoolId: string) {
  const token = getAdminToken();
  if (!token) throw new Error("Missing admin access token");
  const res = await fetch(`/backend/v3/enterprise-schools/${encodeURIComponent(enterpriseSchoolId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return await res.json();
}

export async function upsertEnterpriseMember(input: {
  enterpriseSchoolId: string;
  schoolUserId: string;
  role?: "admin" | "member";
}) {
  const token = getAdminToken();
  if (!token) throw new Error("Missing admin access token");
  const res = await fetch(
    `/backend/v3/enterprise-schools/${encodeURIComponent(input.enterpriseSchoolId)}/members/${encodeURIComponent(
      input.schoolUserId
    )}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role: input.role })
    }
  );
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

export async function removeEnterpriseMember(input: { enterpriseSchoolId: string; schoolUserId: string }) {
  const token = getAdminToken();
  if (!token) throw new Error("Missing admin access token");
  const res = await fetch(
    `/backend/v3/enterprise-schools/${encodeURIComponent(input.enterpriseSchoolId)}/members/${encodeURIComponent(
      input.schoolUserId
    )}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

// -------- Phase 3 messaging --------
export type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

function getAnyToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("any_access_token");
}

export async function sendMessageV3(input: { receiver_id: string; content: string; country_code?: string }) {
  const token = getAnyToken();
  if (!token) throw new Error("Missing access token");
  const res = await fetch("/backend/v3/messages", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return await res.json();
}

export async function fetchInboxV3(): Promise<MessageItem[]> {
  const token = getAnyToken();
  if (!token) throw new Error("Missing access token");
  const res = await fetch("/backend/v3/messages/inbox", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  return (json.messages ?? []) as MessageItem[];
}

export async function fetchSentV3(): Promise<MessageItem[]> {
  const token = getAnyToken();
  if (!token) throw new Error("Missing access token");
  const res = await fetch("/backend/v3/messages/sent", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  return (json.messages ?? []) as MessageItem[];
}

export async function markMessageReadV3(id: string) {
  const token = getAnyToken();
  if (!token) throw new Error("Missing access token");
  const res = await fetch(`/backend/v3/messages/${encodeURIComponent(id)}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

// -------- Phase 3 credential verification --------
export type CredentialVerificationItem = {
  id: string;
  teacherUserId: string;
  type: string;
  status: string;
  submittedAt: string;
  decidedAt: string | null;
  notes: string | null;
};

export async function submitCredentialVerification(input: { type: string; notes?: string }) {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch("/backend/v3/teacher/me/credential-verifications", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return await res.json();
}

export async function fetchMyCredentialVerifications(): Promise<CredentialVerificationItem[]> {
  const token = getTeacherToken();
  if (!token) throw new Error("Missing teacher access token");
  const res = await fetch("/backend/v3/teacher/me/credential-verifications", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json();
  return (json.verifications ?? []) as CredentialVerificationItem[];
}

export async function adminDecideCredentialVerification(input: { id: string; status: "approved" | "rejected"; notes?: string }) {
  const token = getAdminToken();
  if (!token) throw new Error("Missing admin access token");
  const res = await fetch(`/backend/v3/credential-verifications/${encodeURIComponent(input.id)}/decide`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: input.status, notes: input.notes })
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return await res.json();
}


