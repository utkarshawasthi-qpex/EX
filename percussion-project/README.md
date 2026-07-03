# Percussion Project (mirror)

This folder is a **mirror** of the prototype at the repo root. It exists so Vercel projects that were configured with **Root Directory = `percussion-project`** continue to deploy the same app as local development.

## Source of truth

Develop and run locally from the **repo root** (not this folder):

```bash
cd ..
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to `/lifecycle`.

## Deploy on Vercel

**Recommended:** In Vercel → Project → Settings → General → **Root Directory**, leave empty or set to `.` (repo root). Then redeploy.

**Legacy:** If Root Directory is already `percussion-project`, that also works — this folder is kept in sync with the root app. Redeploy after pulling latest `main`.

Both setups use the same `package.json`, Next.js 16 webpack build, and routes (including `/lifecycle/analytics/list`).
