## Phase 2 QA & Integration Verification (Phase 1 must remain intact)

This checklist verifies that Phase 2 dashboards and map overlays work, without changing Phase 1 endpoints or flows.

### Preconditions
- Backend running (default: `http://localhost:3001`)
- Web running (default: `http://localhost:3000`)
- Postgres running and `DATABASE_URL` configured
- Prisma client generated: `npm run prisma:generate`
- Web env: `NEXT_PUBLIC_MAPBOX_TOKEN` set
- You have:
  - A **school JWT** saved in browser `localStorage.school_access_token`
  - A **teacher JWT** saved in browser `localStorage.teacher_access_token`

> Phase 2 endpoints are under `/teachers/v2/*` and `/schools/v2/*`. Phase 1 endpoints remain under `/teachers/*` and `/schools/*`.

---

## 1) Teacher Dashboard Testing (Phase 2)
Open `http://localhost:3000/teacher/dashboard`.

### Availability calendar (date-specific)
- **Click a day** to toggle availability (Available ↔ Off).
- Verify request:
  - `PUT /teachers/v2/me/availability-calendar` with body `{ dates: [{ date: "YYYY-MM-DD", is_available: true|false }] }`
- Verify read-back:
  - Refresh the page
  - Calendar should reflect previously toggled values (fetched via `GET /teachers/v2/me/availability-calendar?from&to`)

### Notifications panel
- Verify request:
  - `GET /teachers/v2/me/notifications` (default)
  - Use **Unread** toggle → `GET ...?unread=true`
- Verify mark-read:
  - Click **Mark read** → `POST /teachers/v2/me/notifications/:id/read`

> Note: There is no UI “create notification” action in Phase 2 scaffold. Insert test rows directly into DB to validate rendering.

### Boost status/badge
- Click **Refresh boost status**
  - `GET /teachers/v2/me/boost/status`
- Click **Activate boost** (stub)
  - `POST /teachers/v2/me/boost/activate`
  - Confirm status updates and shows an “active until” timestamp

### Sticky CTAs
- Scroll the dashboard; header should remain sticky.
- Verify CTA links:
  - `/teacher/register`
  - `/school/register`
  - `/` (Phase 1 map)

---

## 2) School Dashboard Testing (Phase 2)
Open `http://localhost:3000/school/dashboard`.

### Favourites panel
- **Add favourite** (QA helper input):
  - Paste a discoverable `teacherUserId`, click **Add**
  - Verifies: `PUT /schools/v2/favourites/:teacherUserId`
- **Remove favourite**:
  - Click **Remove**
  - Verifies: `DELETE /schools/v2/favourites/:teacherUserId`
- **Fetch list**:
  - Click **Refresh**
  - Verifies: `GET /schools/v2/favourites`
  - Note: list only includes currently discoverable teachers (backend enforces visibility).

### Notifications panel
- Verifies:
  - `GET /schools/v2/me/notifications`
  - Unread toggle uses `?unread=true`
  - Mark read uses `POST /schools/v2/me/notifications/:id/read`

### Sticky CTAs
- Scroll the dashboard; header should remain sticky.
- Verify CTA links:
  - `/teacher/register`
  - `/school/register`
  - `/` (Phase 1 map)

---

## 3) Phase 1 Flow Verification (must remain functional)
Open `http://localhost:3000/`.

### Landing page + postcode scroll
- Enter postcode → page should scroll to map section.

### Map heatmap/clusters and avatars
- Verify default heatmap/clusters render.
- Verify zoom behavior still works as before.

### Phase 2 boost overlay on Phase 1 map (frontend-only)
- Boosted teachers should show a visible ring/badge and appear first in avatar rendering.
- Non-boosted teachers must keep original Phase 1 order (stable partition).

### Profile modal
- Click an avatar → modal opens with Phase 1 teacher profile detail.

### Optional distance filter
- Enable distance filter checkbox and adjust slider:
  - Teacher list count should update
  - Filter is client-side placeholder geocoding (Phase 1 endpoint data remains unchanged)

---

## 4) Minor UI/UX notes to review before Phase 3
- Notifications: consider adding a small “empty state” explanation when DB has no notifications.
- Distance filter: could show “requires postcode” hint (currently checkbox is disabled until postcode is set).
- Boost: consider displaying a small “Boosted” label in hover preview (currently ring highlight only).


