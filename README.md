# Orbit Watch — Live Satellite Tracker

3D real-time satellite tracker built with Next.js 14, react-three-fiber, aur satellite.js.
Data source: Celestrak (free, no API key needed).

## Step 1 — Apne computer pe download/copy karo

Ye poora `space-tracker` folder apne computer pe copy kar lo (ya GitHub se clone karoge, Step 3 dekho).

## Step 2 — Dependencies install karo

Terminal khol kar folder mein jao:

```bash
cd space-tracker
npm install
```

Ye package.json mein likhi saari libraries download karega (Next.js, Three.js, satellite.js waghera).

## Step 3 — Local pe chala kar dekho

```bash
npm run dev
```

Browser mein jao: `http://localhost:3000` — globe ghoomta dikhega, satellites live position update hote rahenge.

Agar globe nahi dikh raha ya error aaye, terminal ka error message check karo — zyada tar wajah missing dependency hoti hai, dobara `npm install` chalao.

## Step 4 — GitHub pe push karo

1. GitHub.com pe login karo, naya repository banao (jaise `orbit-watch`), **empty** rakho (README na add karo wahan)
2. Apne terminal mein:

```bash
git init
git add .
git commit -m "Initial commit: Orbit Watch satellite tracker"
git branch -M main
git remote add origin https://github.com/TUMHARA-USERNAME/orbit-watch.git
git push -u origin main
```

`.gitignore` file already `node_modules` aur build files ko exclude kar deti hai — sirf source code push hoga, clean rahega.

## Step 5 — Vercel pe deploy karo

1. [vercel.com](https://vercel.com) pe jao, **"Sign up"** — GitHub account se login karo (same account jahan repo push kiya)
2. Dashboard mein **"Add New Project"** dabao
3. Apni `orbit-watch` repository select karo — Vercel automatically Next.js detect kar lega
4. Kuch settings change karne ki zaroorat nahi, seedha **"Deploy"** dabao
5. 1-2 minute mein live link mil jayega: `orbit-watch-xyz.vercel.app`

Har baar jab tum GitHub pe naya code push karoge, Vercel automatically redeploy kar dega — kuch manually karne ki zaroorat nahi.

## Step 6 — Custom domain lagana (optional)

Agar apna domain chahiye (jaise `orbitwatch.com`):
1. Namecheap/GoDaddy se domain khareedo (~$10/year)
2. Vercel project → Settings → Domains → apna domain add karo
3. Vercel jo DNS records dikhaye, wo apne domain provider ke DNS settings mein daal do
4. 10-30 minute mein live ho jayega custom domain pe

## Kaise kaam karta hai (short explanation)

- `src/app/api/tle/route.ts` — Celestrak se satellite orbital data (TLE) fetch karta hai, 1 ghante cache rehta hai
- `src/lib/orbit.ts` — TLE data ko real lat/lon/altitude coordinates mein convert karta hai (satellite.js library se)
- `src/components/Earth.tsx` — 3D globe render karta hai (wireframe grid style — mission-control look, koi heavy image texture nahi, isliye fast load hota hai)
- `src/components/SatelliteMarker.tsx` — har satellite ka live position + chhota orbit trail dikhata hai, har frame update hota hai
- `src/components/Hud.tsx` — search bar, satellite list, aur telemetry panel (lat/lon/altitude/speed) — mobile pe bottom sheet, desktop pe side panel

## Naye satellites add karna

`src/lib/satellite-catalog.ts` khol kar list mein naya entry add karo, bas NORAD catalog ID chahiye hoti hai (Celestrak.org se dhoond sakte ho kisi bhi satellite ka naam search kar ke).

## Lighthouse / Performance notes

- Fonts `next/font/google` se load hote hain — automatically self-hosted hote hain (Google ko extra request nahi jaati runtime pe), isse performance score high rehta hai
- Earth ek generated wireframe hai, koi bhari image texture download nahi hoti
- `dpr={[1, 1.75]}` — mobile devices pe rendering resolution capped hai taake GPU pe load kam rahe aur frame rate smooth rahe
- Agar future mein photoreal Earth texture chahiye, `public/textures/` mein apni image daal kar `Earth.tsx` mein `useTexture` se load kar sakte ho — abhi wireframe design jaan-boojh kar rakha hai taake load fast rahe aur "tactical/mission-control" look mile jo generic space website se alag lage

## Gig portfolio ke liye

1. `npm run build && npm run start` chala kar production version dekho (dev mode se thoda slower hota hai, production zyada tez hai)
2. Vercel wala live link screen-record karo (globe ghoomte, satellite click karte, mobile responsive dikhate)
3. Us recording ko Fiverr gig video/gallery mein daal do
