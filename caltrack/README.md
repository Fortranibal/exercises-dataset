# caltrack

Personal nutrition & physique tracker: log meals with **xAI Grok vision**, review daily/history macros, chart progress, track maximum muscular potential (Casey Butt + your sheet coefficients), strength, and physique photos.

## Features

- **Today** — photo + description → Grok estimates calories / protein / carbs / fat; meals grouped as breakfast, lunch, dinner, snack
- **Meals** — full history with attached photos and macro breakdowns
- **Progress** — weekly bars, monthly intake ridge densities, body recomposition stack, calories×protein joint plot
- **MMP** — maximum lean mass + measurement regressions + golden ratios (coefficients in `src/lib/mmp/coefficients.ts`, ported from your Google Sheet)
- **Strength** — lift log with Epley estimated 1RM charts
- **Physique** — dated progress photos with weight & body-fat %
- **Profile** — height, weight, bone structure, activity, phase/strategy

## Setup

```bash
cd caltrack
cp .env.example .env.local
# set XAI_API_KEY=... from https://console.x.ai/
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

SQLite DB is created at `caltrack/data/caltrack.sqlite`. Uploads go to `caltrack/public/uploads/`.

## MMP coefficients

Activity multipliers, phase macro g/kg, golden ratios, and Casey Butt measurement regressions live in:

- `src/lib/mmp/coefficients.ts`
- `src/lib/mmp/calculate.ts`

Female LBM uses the sheet’s **0.83** gender scale on the Casey Butt formula.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Drizzle + better-sqlite3 · AI SDK + `@ai-sdk/xai` · Recharts
