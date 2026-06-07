# Deploying to Vercel (troynolan.com)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173 to preview the site.

## Production build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **Add New Project** and import the GitHub repository.
4. Vercel auto-detects Vite — no custom build settings needed:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
5. Click **Deploy**.

## Global Snake leaderboard (required for shared high scores)

The leaderboard uses a Vercel serverless API (`/api/leaderboard`) with **Redis** so every visitor sees the same top 10 scores.

1. In your Vercel project, go to **Storage** (or [Vercel Marketplace → Redis](https://vercel.com/marketplace?category=storage&search=redis)).
2. Add a **Redis** database and link it to the TroyNolan project.
3. Vercel automatically sets `REDIS_URL`.
4. Redeploy the project.

For local development with the API, link the project and pull env vars:

```bash
npx vercel link
npx vercel env pull .env.local --environment=preview --yes
npx vercel dev
```

Without Redis connected, the site falls back to per-browser scores during local development only.

## Connect troynolan.com

1. In the Vercel project, go to **Settings → Domains**.
2. Add `troynolan.com` and `www.troynolan.com`.
3. At your domain registrar, update DNS per Vercel's instructions:
   - **A record** for `@` → Vercel's IP (shown in the dashboard), or
   - **CNAME** for `www` → `cname.vercel-dns.com`
4. Wait for DNS propagation (usually a few minutes, sometimes up to 48 hours).

## Adding future sections

Create a new component in `src/sections/` (e.g. `About.jsx`), then import and render it in `src/App.jsx` below `<Hero />`.
