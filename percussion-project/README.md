This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The app redirects to `/lifecycle`.

## Deploy on Vercel

This repo contains two Next.js apps. **Local development and analytics work use this folder (`percussion-project/`).**

In Vercel → Project → Settings → General → **Root Directory**, set:

```
percussion-project
```

Then redeploy. Without this, Vercel builds the parent app at the repo root (routes like `/studies`), which is a different, older prototype.
