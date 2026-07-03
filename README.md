# Employee Experience

Manages employee experience and engagement

UX prototype built with the QuestionPro UX Prototype Base.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The analytics portal lives under `/lifecycle/analytics`.

## Deploy on Vercel

This prototype is built from the **repo root** (`employee-experience/`).

In Vercel → Project → Settings → General → **Root Directory**, leave empty or set to `.` — **not** `percussion-project`.

Build command (default): `npm run build`  
Install command (default): `npm install`

After changing Root Directory or pushing to `main`, trigger a **Redeploy** so production matches local.

If your project still uses Root Directory `percussion-project`, that folder is kept as a mirror of this app and will also work after redeploy.

## Building Features

1. Fill in `PRD.md` with the screens and flows you want to build
2. Open Claude Code: `claude`
3. Describe what to build — the LLM reads `PRD.md` and `CLAUDE.md` to understand the product

## Stack

- Next.js + React 19
- QuestionPro WickUI (`@npm-questionpro/wick-ui-lib`)
- Tailwind CSS v4
- TypeScript
