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

## Connect troynolan.com

1. In the Vercel project, go to **Settings → Domains**.
2. Add `troynolan.com` and `www.troynolan.com`.
3. At your domain registrar, update DNS per Vercel's instructions:
   - **A record** for `@` → Vercel's IP (shown in the dashboard), or
   - **CNAME** for `www` → `cname.vercel-dns.com`
4. Wait for DNS propagation (usually a few minutes, sometimes up to 48 hours).

## Adding future sections

Create a new component in `src/sections/` (e.g. `About.jsx`), then import and render it in `src/App.jsx` below `<Hero />`.
