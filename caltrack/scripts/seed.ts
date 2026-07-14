import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "caltrack.sqlite");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

const mealCount = (
  db.prepare("SELECT COUNT(*) as c FROM meals").get() as { c: number }
).c;

if (mealCount > 0) {
  console.log("Meals already present — skip seed.");
  process.exit(0);
}

const today = new Date();
function daysAgo(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const sampleMeals = [
  { date: daysAgo(0), mealType: "lunch", name: "minced meat", quantity: "170 g cooked", calories: 290, proteinG: 33, carbsG: 2, fatG: 18, time: "14:41" },
  { date: daysAgo(0), mealType: "snack", name: "black coffee", quantity: "2 cups", calories: 2, proteinG: 0, carbsG: 0, fatG: 0, time: "10:00" },
  { date: daysAgo(1), mealType: "lunch", name: "beef stir-fry with rice", quantity: "plate", calories: 725, proteinG: 61, carbsG: 55, fatG: 28, time: "14:00" },
  { date: daysAgo(1), mealType: "dinner", name: "YoPro yogurt + dark chocolate", quantity: "450g + 20g", calories: 356, proteinG: 45, carbsG: 22, fatG: 12, time: "21:30" },
  { date: daysAgo(2), mealType: "lunch", name: "chicken bowl", quantity: "1 bowl", calories: 680, proteinG: 58, carbsG: 60, fatG: 18, time: "13:30" },
  { date: daysAgo(3), mealType: "dinner", name: "salmon + potatoes", quantity: "plate", calories: 820, proteinG: 52, carbsG: 55, fatG: 35, time: "20:00" },
  { date: daysAgo(4), mealType: "lunch", name: "turkey wrap", quantity: "2 wraps", calories: 610, proteinG: 48, carbsG: 50, fatG: 20, time: "14:10" },
  { date: daysAgo(5), mealType: "dinner", name: "lean beef pasta", quantity: "plate", calories: 900, proteinG: 55, carbsG: 95, fatG: 28, time: "19:45" },
  { date: daysAgo(6), mealType: "lunch", name: "tuna salad", quantity: "large", calories: 520, proteinG: 50, carbsG: 18, fatG: 26, time: "13:00" },
];

const insertMeal = db.prepare(`
  INSERT INTO meals (id, date, time, meal_type, name, quantity, calories, protein_g, carbs_g, fat_g)
  VALUES (@id, @date, @time, @mealType, @name, @quantity, @calories, @proteinG, @carbsG, @fatG)
`);

const insertBody = db.prepare(`
  INSERT INTO body_logs (id, date, weight_kg, body_fat_pct, chest_cm, shoulders_cm, upper_arm_cm, thigh_cm, calf_cm, glutes_cm, neck_cm, abdomen_cm)
  VALUES (@id, @date, @weightKg, @bodyFatPct, @chestCm, @shouldersCm, @upperArmCm, @thighCm, @calfCm, @glutesCm, @neckCm, @abdomenCm)
`);

const bodySeed = [
  { date: daysAgo(90), weightKg: 55.2, bodyFatPct: 24.5 },
  { date: daysAgo(60), weightKg: 54.1, bodyFatPct: 23.9 },
  { date: daysAgo(30), weightKg: 53.4, bodyFatPct: 23.8 },
  { date: daysAgo(0), weightKg: 53.0, bodyFatPct: 23.7, chestCm: 83.9, shouldersCm: 97.2, upperArmCm: 25.1, thighCm: 43.2, calfCm: 31.8, glutesCm: 94.8, neckCm: 32.7, abdomenCm: 84.4 },
];

db.transaction(() => {
  for (const m of sampleMeals) {
    insertMeal.run({ id: randomUUID(), ...m });
  }
  for (const b of bodySeed) {
    insertBody.run({
      id: randomUUID(),
      chestCm: null,
      shouldersCm: null,
      upperArmCm: null,
      thighCm: null,
      calfCm: null,
      glutesCm: null,
      neckCm: null,
      abdomenCm: null,
      ...b,
    });
  }
})();

console.log(`Seeded ${sampleMeals.length} meals and ${bodySeed.length} body logs.`);
