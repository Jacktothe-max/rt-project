## Phase 1 Web (Next.js Map Flow)

This app consumes backend endpoints:
- `GET /schools/teachers`
- `GET /schools/teachers/:teacherUserId`

### Environment
- `NEXT_PUBLIC_MAPBOX_TOKEN` (required)
- `NEXT_PUBLIC_BACKEND_URL` (optional; defaults to `http://localhost:3001`)

### Run
```bash
cd apps/web
npm install
npm run dev
```

### Notes (Phase 1)
- Postcode geocoding is a deterministic placeholder (`fakeGeocode`) and should be replaced later.
- School endpoints require an authenticated school token; the stub page `/school/register` stores a token in `localStorage`.


