# Forge Gym — Workout Tracker

A Hevy-style gym workout tracking app built with Next.js. Log workouts, build routines,
track progress, analyze training, set goals, and monitor body measurements — with no
paywalls or limits.

Built on top of the [`exercises-dataset`](../) (1,324 exercises with images, GIFs, and
multilingual instructions), which lives in the parent directory.

This app is separate from **Forge Meals** (`../forge-meals/`), the meal & physique tracker.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (dark, mobile-first UI)
- **Prisma** + **SQLite** (zero-config local database)
- **Recharts** (progress & analytics charts)
- **html-to-image** (shareable workout cards)

## Prerequisites

- Node.js 20.19+ (tested on Node 23)
- The parent repo's `data/`, `images/`, and `videos/` folders (already present)

## Setup

```bash
cd forge-gym
npm install

# Generate the Prisma client, create the SQLite DB, and seed all 1,324 exercises
npm run db:generate
npm run db:push
npm run db:seed
```

Exercise media is served from `public/images` and `public/videos`, which are symlinks to
the parent repo's `images/` and `videos/` folders. If they're missing, recreate them:

```bash
cd public
ln -sfn ../../images images
ln -sfn ../../videos videos
```

## Run

```bash
npm run dev        # http://localhost:3000
```

Add it to your iPhone Home Screen (Share → Add to Home Screen) for an app-like,
full-screen PWA experience.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run db:push` | Sync schema to SQLite |
| `npm run db:seed` | Seed exercises from `../data/exercises.json` |
| `npm run db:reset` | Reset DB and re-seed |

## Features

- **Exercise library** — 1,324 exercises with search, filters (body part / equipment /
  target), GIFs, multilingual instructions, and custom exercises.
- **Routines** — create, edit, reorder, and duplicate workout templates with per-exercise
  default sets/reps/weight.
- **Workout logger** — start empty or from a routine, log sets/reps/weight, see previous
  performance, warmup/drop/failure set types, live timer, and autosave.
- **History & calendar** — full session history with a monthly training calendar.
- **Progress & records** — per-exercise charts (heaviest, est. 1RM, volume, reps) and a
  1RM–20RM rep-max table (estimated + best actual).
- **Analytics** — period filters (1W–1Y / custom / all), totals, weekly-volume trend, and
  muscle-group breakdown (volume / sets / reps / workouts) with a distribution donut.
- **Goals** — weekly targets (workouts / volume / sets per muscle group) with progress
  rings on the home screen.
- **Body tracking** — 12 metrics (weight, body fat, neck, shoulders, chest, upper arm,
  biceps, forearm, waist, hips, thigh, calf) with trend charts, per-metric goals, and history.
- **Share cards** — Strava-style workout summary images via the Web Share API.
- **Data export** — download all your data as JSON.

## Notes

- **Single-user / local-first.** Data is stored in a local SQLite file (`prisma/dev.db`).
  Every table carries no auth coupling, so multi-user support can be layered on later.
- **Media license.** Exercise images/GIFs come from the parent dataset and are for personal,
  non-commercial use. Replace them with licensed assets before any public distribution.
