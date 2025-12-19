## Relief Teaching Marketplace (Backend + Web)

This scaffold includes:
- `POST /teachers/register` (creates user + profile + location + weekly availability, returns JWT)
- `POST /teachers/subscribe` (stub; creates subscription row, no payments)

### Setup
1. Install deps:

```bash
npm install
```

2. Configure environment variables:

- Copy `env.example` to a local env file (or set env vars in your shell) and ensure `DATABASE_URL` points at Postgres.
- IMPORTANT: do not commit secrets. This repo intentionally ignores `.env*` files via `.gitignore`.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run the API:

```bash
npm run dev
```

### Web app (Next.js)
From `apps/web`:

```bash
npm install
npm run dev
```

The web app uses the existing backend via the `/backend/*` proxy.

### Publish to GitHub (so another agent can collaborate)
If you don’t have Git installed on Windows, install it first:

```powershell
winget install --id Git.Git -e
```

Then (from the repo root):

```powershell
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repo on GitHub, then:

```powershell
git branch -M main
git remote add origin https://github.com/<YOUR_USER>/<YOUR_REPO>.git
git push -u origin main
```


