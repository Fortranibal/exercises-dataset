/**
 * Seed rich demo data for Forge charts (multi-month intake + body recomp).
 * Usage: npx tsx scripts/seed.ts [--force]
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const force = process.argv.includes("--force");
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "caltrack.sqlite");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

// Ensure tables exist (same schema as app bootstrap)
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    height_cm REAL NOT NULL DEFAULT 170,
    weight_kg REAL NOT NULL DEFAULT 70,
    age INTEGER NOT NULL DEFAULT 30,
    gender TEXT NOT NULL DEFAULT 'M',
    activity TEXT NOT NULL DEFAULT 'moderate',
    wrist_cm REAL NOT NULL DEFAULT 17,
    ankle_cm REAL NOT NULL DEFAULT 22,
    knee_cm REAL NOT NULL DEFAULT 36,
    body_fat_pct REAL NOT NULL DEFAULT 18,
    phase TEXT NOT NULL DEFAULT 'maintenance',
    strategy TEXT NOT NULL DEFAULT 'conservative',
    calorie_target INTEGER,
    protein_target INTEGER,
    maintenance_kcal INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT,
    meal_type TEXT NOT NULL DEFAULT 'snack',
    name TEXT NOT NULL,
    description TEXT,
    quantity TEXT,
    calories REAL NOT NULL DEFAULT 0,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    photo_path TEXT,
    ai_raw TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS body_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    body_fat_pct REAL,
    neck_cm REAL,
    abdomen_cm REAL,
    shoulders_cm REAL,
    chest_cm REAL,
    upper_arm_cm REAL,
    fore_arm_cm REAL,
    thigh_cm REAL,
    calf_cm REAL,
    glutes_cm REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const mealCount = (
  db.prepare("SELECT COUNT(*) as c FROM meals").get() as { c: number }
).c;

if (mealCount > 0 && !force) {
  console.log("Meals already present — skip seed (pass --force to replace).");
  process.exit(0);
}

if (force) {
  db.exec("DELETE FROM meals; DELETE FROM body_logs;");
  console.log("Cleared existing meals/body_logs.");
}

const profileCount = (
  db.prepare("SELECT COUNT(*) as c FROM profiles").get() as { c: number }
).c;
if (profileCount === 0) {
  db.prepare(
    `INSERT INTO profiles (
      height_cm, weight_kg, age, gender, activity,
      wrist_cm, ankle_cm, knee_cm, body_fat_pct, phase, strategy,
      calorie_target, protein_target
    ) VALUES (158, 53, 26, 'F', 'moderate', 14.1, 19.9, 32.9, 23.7, 'cut', 'conservative', 1900, 150)`,
  ).run();
} else if (force) {
  db.prepare(
    `UPDATE profiles SET phase='cut', calorie_target=1900, protein_target=150, weight_kg=53, body_fat_pct=23.7 WHERE id=1`,
  ).run();
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function dateISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Month profiles: mean calories / protein with noise — drifts down May/Jun like the reference */
const months: Array<{
  y: number;
  m: number;
  days: number;
  calMean: number;
  calSd: number;
  pMean: number;
  pSd: number;
}> = [
  { y: 2026, m: 2, days: 8, calMean: 2750, calSd: 320, pMean: 185, pSd: 22 },
  { y: 2026, m: 3, days: 28, calMean: 2680, calSd: 350, pMean: 190, pSd: 24 },
  { y: 2026, m: 4, days: 28, calMean: 2550, calSd: 380, pMean: 178, pSd: 26 },
  { y: 2026, m: 5, days: 26, calMean: 2350, calSd: 360, pMean: 142, pSd: 28 },
  { y: 2026, m: 6, days: 26, calMean: 2280, calSd: 340, pMean: 135, pSd: 30 },
  { y: 2026, m: 7, days: 12, calMean: 1750, calSd: 280, pMean: 95, pSd: 25 },
];

const insertMeal = db.prepare(`
  INSERT INTO meals (id, date, time, meal_type, name, quantity, calories, protein_g, carbs_g, fat_g)
  VALUES (@id, @date, @time, @mealType, @name, @quantity, @calories, @proteinG, @carbsG, @fatG)
`);

const insertBody = db.prepare(`
  INSERT INTO body_logs (id, date, weight_kg, body_fat_pct)
  VALUES (@id, @date, @weightKg, @bodyFatPct)
`);

let mealRows = 0;

db.transaction(() => {
  for (const month of months) {
    const used = new Set<number>();
    for (let i = 0; i < month.days; i++) {
      let day = 1 + Math.floor(Math.random() * 28);
      while (used.has(day)) day = 1 + Math.floor(Math.random() * 28);
      used.add(day);
      const date = dateISO(month.y, month.m, day);
      const calories = Math.round(
        clamp(rand(month.calMean - month.calSd, month.calMean + month.calSd), 900, 4200),
      );
      const proteinG = Math.round(
        clamp(rand(month.pMean - month.pSd, month.pMean + month.pSd), 40, 250),
      );
      const fatG = Math.round(calories * rand(0.25, 0.38) / 9);
      const carbsG = Math.max(
        0,
        Math.round((calories - proteinG * 4 - fatG * 9) / 4),
      );

      const lunchShare = rand(0.4, 0.55);
      const dinnerShare = rand(0.3, 0.4);
      const snackShare = 1 - lunchShare - dinnerShare;
      const lunchNames = [
        "chicken rice bowl",
        "beef stir-fry",
        "tuna salad",
        "turkey wrap",
        "salmon + greens",
      ];
      const dinnerNames = [
        "lean pasta",
        "yogurt bowl",
        "steak + potatoes",
        "tofu stir-fry",
        "omelette plate",
      ];
      const snackNames = [
        "Greek yogurt",
        "protein shake",
        "banana + PB",
        "dark chocolate",
        "cottage cheese",
      ];
      const pick = (arr: string[]) =>
        arr[Math.floor(Math.random() * arr.length)];
      const parts = [
        {
          mealType: "lunch",
          share: lunchShare,
          time: "13:30",
          name: pick(lunchNames),
        },
        {
          mealType: "dinner",
          share: dinnerShare,
          time: "20:00",
          name: pick(dinnerNames),
        },
        {
          mealType: "snack",
          share: snackShare,
          time: "16:30",
          name: pick(snackNames),
        },
      ];
      for (const part of parts) {
        insertMeal.run({
          id: randomUUID(),
          date,
          time: part.time,
          mealType: part.mealType,
          name: part.name,
          quantity: null,
          calories: Math.round(calories * part.share),
          proteinG: Math.round(proteinG * part.share),
          carbsG: Math.round(carbsG * part.share),
          fatG: Math.round(fatG * part.share),
        });
        mealRows += 1;
      }
    }
  }

  // Body recomposition arc: Feb ~55.5kg/24.8% → Jul ~53.0kg/23.5%
  const bodyPoints = [
    { date: "2026-02-08", weightKg: 55.8, bodyFatPct: 25.2 },
    { date: "2026-02-22", weightKg: 55.4, bodyFatPct: 24.9 },
    { date: "2026-03-10", weightKg: 54.9, bodyFatPct: 24.6 },
    { date: "2026-03-28", weightKg: 54.5, bodyFatPct: 24.3 },
    { date: "2026-04-12", weightKg: 54.1, bodyFatPct: 24.0 },
    { date: "2026-04-28", weightKg: 53.8, bodyFatPct: 23.9 },
    { date: "2026-05-15", weightKg: 53.5, bodyFatPct: 23.8 },
    { date: "2026-05-30", weightKg: 53.3, bodyFatPct: 23.7 },
    { date: "2026-06-14", weightKg: 53.1, bodyFatPct: 23.6 },
    { date: "2026-06-28", weightKg: 53.0, bodyFatPct: 23.5 },
    { date: "2026-07-10", weightKg: 53.0, bodyFatPct: 23.5 },
    { date: "2026-07-14", weightKg: 52.9, bodyFatPct: 23.4 },
  ];
  for (const b of bodyPoints) {
    insertBody.run({ id: randomUUID(), ...b });
  }
})();

console.log(`Seeded ${mealRows} meal rows across ${months.length} months + body logs.`);
