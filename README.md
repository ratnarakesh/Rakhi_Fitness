# Rakhi Fitness

High-performance, dark-theme fitness tracking **PWA**. Training volume, body-weight
KPIs, a strict Zero-Oil / Zero-Sugar / Zero-Salt dietary audit, and a camera-based
progress-photo timeline — all client-side, zero backend, **$0 to run**.

## Stack

| Layer      | Choice                                    |
| ---------- | ----------------------------------------- |
| Framework  | Next.js 15 (App Router) — **static export** |
| Language   | TypeScript (strict)                       |
| UI         | Tailwind CSS + Framer Motion + lucide-react |
| State      | React Context, persisted to `localStorage` |
| Fonts      | Inter via `next/font` (self-hosted at build) |
| Hosting    | Cloudflare Pages (free tier)              |

### Why no database / Contentful?

Every metric lives in the browser's `localStorage`, so there is **no server, no DB,
and no per-user cost**. Contentful (or any CMS/API) is intentionally **not** wired in —
it would add a paid dependency for data that never leaves the device. If you later want
cross-device sync or remote content, that is the seam to add it (fetch in a client
component and merge into `GlobalContext`), but it is not required for the MVP.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build (static export)

```bash
npm run build      # outputs ./out
npm run preview    # serve ./out locally to sanity-check the export
```

`next.config.mjs` sets `output: 'export'`, so `npm run build` writes a fully static
site to `./out` — no Node runtime needed at the edge.

## Deploy to Cloudflare Pages (free)

**Option A — Git integration (recommended)**

1. Push this repo to GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Framework preset:** Next.js (Static HTML Export)
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
4. Deploy. Every push auto-builds.

**Option B — Direct upload via Wrangler**

```bash
npm run build
npx wrangler pages deploy out --project-name rakhi-fitness
```

## PWA install assets (add before publishing)

The manifest and metadata reference icons that are **not** committed (binary assets):

- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)
- `public/icons/icon-maskable-512.png` (512×512, maskable safe-zone)

Generate them from any 1024px source (e.g. https://realfavicongenerator.net or
`npx pwa-asset-generator logo.png public/icons`). The app runs fine without them; you
just won't get a custom home-screen icon until they exist.

## Exercise instruction GIFs (optional)

The tracker renders a looping technique GIF per movement from `public/gifs/<id>.gif`
(ids in `lib/exercises.ts`, e.g. `bench-press.gif`). Missing files fall back to an
"add asset" placeholder — no crash. Drop in your own loops to light them up.

## Architecture map

```
app/
  layout.tsx          Root shell: GlobalProvider, metadata/viewport, SW register, bottom nav
  page.tsx            Dashboard — bodyweight KPI, steps/water grid, dietary audit, CTA
  tracker/page.tsx    Exercise selector + GIF frame + set rows + COMMIT LOG (volume calc)
  progress/page.tsx   Bodyweight update + camera capture + masonry photo timeline
context/GlobalContext.tsx   Typed state engine, localStorage write-through
components/          BottomNav, ProgressBar, ServiceWorkerRegister
lib/                utils (cn/fmt/pct/date), exercises matrix
public/             manifest.json, sw.js, icons/, gifs/
```

## Core rules enforced

- **Training volume** = Σ(weight × reps) across all committed sets.
- **Dietary compliance** — a meal passes only when `zeroOil && zeroSugar && zeroSalt`.
  The dashboard raises a red-alert audit banner on any breach.
