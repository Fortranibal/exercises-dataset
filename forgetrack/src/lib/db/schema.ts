import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  heightCm: real("height_cm").notNull().default(170),
  weightKg: real("weight_kg").notNull().default(70),
  age: integer("age").notNull().default(30),
  gender: text("gender", { enum: ["M", "F"] }).notNull().default("M"),
  activity: text("activity", {
    enum: ["sedentary", "light", "moderate", "active", "athlete"],
  })
    .notNull()
    .default("moderate"),
  wristCm: real("wrist_cm").notNull().default(17),
  ankleCm: real("ankle_cm").notNull().default(22),
  kneeCm: real("knee_cm").notNull().default(36),
  bodyFatPct: real("body_fat_pct").notNull().default(18),
  phase: text("phase", { enum: ["cut", "maintenance", "bulk"] })
    .notNull()
    .default("maintenance"),
  strategy: text("strategy", { enum: ["conservative", "aggressive"] })
    .notNull()
    .default("conservative"),
  calorieTarget: integer("calorie_target"),
  proteinTarget: integer("protein_target"),
  maintenanceKcal: integer("maintenance_kcal"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const meals = sqliteTable("meals", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time"), // HH:mm
  mealType: text("meal_type", {
    enum: ["breakfast", "lunch", "dinner", "snack"],
  })
    .notNull()
    .default("snack"),
  name: text("name").notNull(),
  description: text("description"),
  quantity: text("quantity"),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  photoPath: text("photo_path"),
  aiRaw: text("ai_raw"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const bodyLogs = sqliteTable("body_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  weightKg: real("weight_kg").notNull(),
  bodyFatPct: real("body_fat_pct"),
  neckCm: real("neck_cm"),
  abdomenCm: real("abdomen_cm"),
  shouldersCm: real("shoulders_cm"),
  chestCm: real("chest_cm"),
  upperArmCm: real("upper_arm_cm"),
  foreArmCm: real("fore_arm_cm"),
  thighCm: real("thigh_cm"),
  calfCm: real("calf_cm"),
  glutesCm: real("glutes_cm"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const strengthLogs = sqliteTable("strength_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  exercise: text("exercise").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull(),
  estimated1rm: real("estimated_1rm"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const physiquePhotos = sqliteTable("physique_photos", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  weightKg: real("weight_kg"),
  bodyFatPct: real("body_fat_pct"),
  photoPath: text("photo_path").notNull(),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Profile = typeof profiles.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type BodyLog = typeof bodyLogs.$inferSelect;
export type StrengthLog = typeof strengthLogs.$inferSelect;
export type PhysiquePhoto = typeof physiquePhotos.$inferSelect;
