# Forge Meals — Meal & Physique Tracker

Personal meal & physique tracker: log meals with **xAI Grok vision**, review daily/history macros, chart progress (ridge densities, recomposition, calories×protein), track maximum muscular potential, strength, and physique photos.

This app is separate from **Forge Gym** (`../forge-gym/`), the workout tracker.

## Features

- **Today** — photo + description → Grok estimates macros; meals by breakfast / lunch / dinner / snack
- **Meals** — full history with photos and macro breakdowns
- **Progress** — weekly bars, monthly intake ridge plots, body recomposition stack, calories×protein joint plot
- **MMP** — Casey Butt lean-mass + measurement regressions (`src/lib/mmp/`)
- **Strength** — lift log with Epley estimated 1RM charts
- **Physique** — dated progress photos with weight & body-fat %
- **Profile** — anthropometrics / phase settings

## Setup

```bash
cd forge-meals
cp .env.example .env.local
# set XAI_API_KEY=... from https://console.x.ai/
npm install
npm run seed:force   # multi-month demo data for Progress charts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

SQLite lives at `data/forge-meals.sqlite`. Uploads at `data/uploads/` (served via `/api/uploads/...`).

## Stack

Next.js (App Router) · TypeScript · Tailwind · Drizzle + better-sqlite3 · AI SDK + `@ai-sdk/xai` · Recharts
