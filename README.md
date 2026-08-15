# OrbitWatch / OrbitMap — 3D Real-Time Satellite Tracker

**Live demo: [orbitmap.space](https://orbitmap.space)**

A real-time 3D satellite tracker built with Next.js 14 and React Three Fiber. Watch the ISS, Hubble, weather satellites, and Starlink move across a live wireframe globe, a 2D map, or a naked-eye sky view — all powered by real orbital data.

---

### 🚀 Hire Me — Custom 3D / WebGL Development

This project is a portfolio piece. If you need a custom **Next.js, React Three Fiber, or WebGL** build — interactive 3D dashboards, data visualizations, real-time tracking apps, or marketing sites with a "mission control" feel like this one — I'm available for freelance and contract work.

📩 **Contact:** [info@orbitmap.space](mailto:info@orbitmap.space)

---

## Features

- **Next.js 14 (App Router)** — server components fetch initial data, client components handle all interactivity
- **React Three Fiber + three.js** — a real-time, rotating wireframe 3D globe (no heavy Earth texture, so it loads fast)
- **CelesTrak TLE API integration** — live orbital element data for hundreds of active satellites, fetched server-side and cached (`src/app/api/tle/route.ts`)
- **satellite.js (SGP4/SDP4)** — converts raw TLE data into real-time latitude/longitude/altitude positions
- **Three view modes** — 3D globe, 2D Leaflet map, and a sky-dome "what's above me right now" view
- **Pass predictions** — see when a satellite (e.g. the ISS) will next be visible from your location
- **Tailwind CSS** — utility-first styling with a dark, tactical "mission-control" visual theme
- **PWA-ready** — installable with an offline-capable service worker
- **Optional Supabase backend** — powers the blog and affiliate products pages (not required to run the core tracker)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| 3D rendering | three.js, @react-three/fiber, @react-three/drei |
| Orbital mechanics | satellite.js |
| 2D map | Leaflet, react-leaflet |
| Styling | Tailwind CSS |
| Backend (optional) | Supabase (Postgres + RLS) |
| Data source | [CelesTrak](https://celestrak.org) (free, no API key required) |

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm (or your preferred package manager)

### Installation

```bash
git clone https://github.com/YOUR-USERNAME/orbit-watch.git
cd orbit-watch
npm install
```

### Environment variables

The core satellite tracker (globe, map, sky view, TLE data) works with **no environment variables at all** — CelesTrak requires no API key.

The blog and products pages use Supabase, and analytics is optional. Copy the example env file and fill in your own values if you want those features:

```bash
cp .env.example .env.local
```

See [`.env.example`](.env.example) for the full list of variables and what each one does. Never commit `.env.local` — it's already listed in `.gitignore`.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the landing page loads first; click **Launch App** (or go to `/app`) for the live tracker.

### Production build

```bash
npm run build
npm run start
```

## Deployment

Deploys cleanly to [Vercel](https://vercel.com) with zero configuration — connect the GitHub repo, add your environment variables (if using Supabase/analytics) in Project Settings, and deploy.

## Project Structure

```
src/
  app/            # Next.js App Router pages & API routes
    api/tle/      # Serves cached CelesTrak satellite data
    api/subscribe/# Pass-alert signup endpoint
  components/     # React components (3D scene, HUD, map, sky view, etc.)
  lib/            # Orbital math, TLE fetching/caching, Supabase clients, hooks
  workers/        # Web Worker for off-main-thread orbit propagation
```

See [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) for a full file-by-file breakdown of how the app works.

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you'd like to change.

## License

MIT — see [LICENSE](LICENSE) for details.
