import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

type RawExercise = {
  id: string;
  name: string;
  category?: string;
  body_part?: string;
  equipment?: string;
  target?: string;
  muscle_group?: string;
  secondary_muscles?: string[];
  instructions?: Record<string, string>;
  instruction_steps?: Record<string, string[]>;
  image?: string;
  gif_url?: string;
};

async function main() {
  const dataPath = join(process.cwd(), "..", "data", "exercises.json");
  const raw = JSON.parse(readFileSync(dataPath, "utf-8")) as RawExercise[];
  console.log(`Loaded ${raw.length} exercises from dataset.`);

  // Wipe library rows so re-seeding is idempotent (keeps custom exercises).
  await prisma.exercise.deleteMany({ where: { isCustom: false } });

  const rows = raw.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category ?? "",
    bodyPart: e.body_part ?? e.category ?? "",
    equipment: e.equipment ?? "",
    target: e.target ?? "",
    muscleGroup: e.muscle_group ?? "",
    secondaryMuscles: JSON.stringify(e.secondary_muscles ?? []),
    instructions: JSON.stringify(e.instructions ?? {}),
    instructionSteps: JSON.stringify(e.instruction_steps ?? {}),
    image: e.image ?? null,
    gifUrl: e.gif_url ?? null,
    isCustom: false,
  }));

  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.exercise.createMany({ data: rows.slice(i, i + BATCH) });
    process.stdout.write(`  seeded ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  console.log(`\nSeed complete: ${rows.length} library exercises.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
