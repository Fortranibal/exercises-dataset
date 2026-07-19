import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "forge-meals.sqlite");

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
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

    CREATE TABLE IF NOT EXISTS strength_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      exercise TEXT NOT NULL,
      reps INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      estimated_1rm REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS physique_photos (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      weight_kg REAL,
      body_fat_pct REAL,
      photo_path TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const count = sqlite.prepare("SELECT COUNT(*) as c FROM profiles").get() as {
    c: number;
  };
  if (count.c === 0) {
    sqlite
      .prepare(
        `INSERT INTO profiles (
          height_cm, weight_kg, age, gender, activity,
          wrist_cm, ankle_cm, knee_cm, body_fat_pct, phase, strategy
        ) VALUES (158, 53, 26, 'F', 'moderate', 14.1, 19.9, 32.9, 23.7, 'maintenance', 'conservative')`,
      )
      .run();
  }

  return sqlite;
}

const globalForDb = globalThis as unknown as {
  __forgeMealsSqlite?: Database.Database;
};

const sqlite = globalForDb.__forgeMealsSqlite ?? ensureDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__forgeMealsSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
