## Pre-Release Verification Report (Phases 1–3)

**Scope:** Verify Phase 1–3 features are integrated and ready for release **without breaking Phase 1/2**.  
**Note:** This repo depends on a running Postgres + seeded users/tokens for runtime verification. Automated checks below are fully executed; runtime checks are provided as a structured checklist.

---

### 0) Automated checks (executed)

- **Backend TypeScript build:** ✅ pass (`npm run build` in repo root)
- **Web (Next.js) production build + typecheck:** ✅ pass (`npm run build` in `apps/web`)

---

## 1) Phase 1 Verification (manual QA checklist)

Open `http://localhost:3000/` (Phase 1 landing + map).

- [ ] **Landing page loads** with sticky CTAs visible
- [ ] **Postcode submit** scrolls to map section
- [ ] **Heatmap/clusters render** at default zoom
- [ ] **Zoom behavior** works (clusters/heat ↔ avatar markers per current thresholds)
- [ ] **Avatar click** opens profile modal
- [ ] **Profile modal** displays Phase 1 fields + contact relay
- [ ] **Sticky CTAs** remain visible throughout scrolling

### Phase 1 responsive
- [ ] iPhone-size viewport: header not broken; buttons still reachable
- [ ] Desktop: layout clean, no overflow

---

## 2) Phase 2 Verification (manual QA checklist)

### Teacher dashboard (Phase 2)
Open `http://localhost:3000/teacher/dashboard`

- [ ] **Calendar toggle** persists (PUT then GET confirms)
  - `PUT /teachers/v2/me/availability-calendar`
  - `GET /teachers/v2/me/availability-calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`
- [ ] **Notifications load**
  - `GET /teachers/v2/me/notifications` and `?unread=true`
- [ ] **Mark notification read**
  - `POST /teachers/v2/me/notifications/:id/read`
- [ ] **Boost status loads**
  - `GET /teachers/v2/me/boost/status`
- [ ] **Boost activate stub works**
  - `POST /teachers/v2/me/boost/activate`
- [ ] Sticky CTAs remain visible and functional

### School dashboard (Phase 2)
Open `http://localhost:3000/school/dashboard`

- [ ] **Favourites list loads**
  - `GET /schools/v2/favourites`
- [ ] **Add favourite** works (PUT)
  - `PUT /schools/v2/favourites/:teacherUserId`
- [ ] **Remove favourite** works (DELETE)
  - `DELETE /schools/v2/favourites/:teacherUserId`
- [ ] **Notifications load**
  - `GET /schools/v2/me/notifications` and `?unread=true`
- [ ] **Mark notification read**
  - `POST /schools/v2/me/notifications/:id/read`
- [ ] Sticky CTAs remain visible and functional

### Phase 1 map overlays from Phase 2
Open `http://localhost:3000/` and verify:
- [ ] **Boosted teachers show amber ring**
- [ ] **Boosted teachers render first** (stable partition)
- [ ] **Non-boosted keep original Phase 1 order**
- [ ] **Optional distance filter** filters client-side only and does not change `/schools/teachers` payload

---

## 3) Phase 3 Verification (manual QA checklist)

### Multi-country (Phase 3)
Open `http://localhost:3000/v3/map`

- [ ] Country selector changes `country_code` and teacher list updates using:
  - `GET /schools/v3/teachers?country_code=XX`
- [ ] Teacher modal uses country-aware detail endpoint:
  - `GET /schools/v3/teachers/:teacherUserId?country_code=XX`
- [ ] Country config panel loads from:
  - `GET /v3/configs`
  - shows **currency_code**, **legal_url**, and parsed **pricing_json** (or parse error)

### Enterprise workflows (Phase 3)
Open `http://localhost:3000/v3/enterprise`

- [ ] Create org (admin token) → `POST /v3/enterprise-schools`
- [ ] Load org by id → `GET /v3/enterprise-schools/:id`
- [ ] Add/update member → `PUT /v3/enterprise-schools/:id/members/:schoolUserId`
- [ ] Remove member → `DELETE /v3/enterprise-schools/:id/members/:schoolUserId`
- [ ] Reports summary returns 200:
  - `GET /v3/enterprise-schools/:id/reports/summary`
- [ ] Batch notifications returns 201 and creates notifications:
  - `POST /v3/enterprise-schools/:id/notifications/batch`
- [ ] Bulk teacher list returns 200:
  - `GET /v3/enterprise-schools/:id/teachers?country_code=XX`

### Messaging (Phase 3)
Open `http://localhost:3000/v3/messages`

- [ ] Send message → `POST /v3/messages`
- [ ] Inbox refresh + polling → `GET /v3/messages/inbox`
- [ ] Sent refresh + polling → `GET /v3/messages/sent`
- [ ] Mark read → `POST /v3/messages/:id/read`
- [ ] **Permission enforcement:** school→teacher requires `country_code` and teacher must be discoverable today (server-side).

### Credential verification (Phase 3)
Open `http://localhost:3000/v3/verifications`

- [ ] Teacher submits request → `POST /v3/teacher/me/credential-verifications`
- [ ] Teacher sees list → `GET /v3/teacher/me/credential-verifications`
- [ ] Admin decides → `POST /v3/credential-verifications/:id/decide`
- [ ] Teacher receives system alert notification (Phase 2 notification endpoints should show it):
  - `GET /teachers/v2/me/notifications`
- [ ] Phase 3 teacher modal shows credential verification summary via v3 detail endpoint.

### Subscription tiers (Phase 3)
- [ ] Teacher dashboard tier badge loads → `GET /v3/teacher/me/subscription`
- [ ] School dashboard tier badge loads → `GET /v3/school/me/subscription`
- [ ] Priority/boost highlighting appears in Phase 3 map:
  - boosted ring (boost flags)
  - priority ring (pro tier)

---

## 4) Minor UI/UX notes (to fix before release)

- **Country selector crowding on mobile**: fixed by hiding the “Country” label on small screens and allowing CTA containers to wrap (`flex-wrap`) in sticky headers. Re-verify on iPhone-size viewport.
- **Messaging polling**: 5s polling is acceptable as a scaffold, but confirm it doesn’t spam logs/requests in production.
- **Enterprise page**: JSON viewer is intentionally raw; consider a smaller “member list” UI later.


