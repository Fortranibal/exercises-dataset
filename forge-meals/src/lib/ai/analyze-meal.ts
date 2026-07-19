import { generateObject } from "ai";
import { xai } from "@ai-sdk/xai";
import { z } from "zod";

const mealAnalysisSchema = z.object({
  name: z.string().describe("Short food name"),
  mealType: z
    .enum(["breakfast", "lunch", "dinner", "snack"])
    .describe("Best-guess meal category"),
  quantity: z
    .string()
    .describe("Estimated portion, e.g. '200 g cooked' or '1 bowl'"),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.string(),
        calories: z.number(),
        proteinG: z.number(),
        carbsG: z.number(),
        fatG: z.number(),
      }),
    )
    .describe("Individual components if multiple foods are visible"),
  calories: z.number().describe("Total estimated calories (kcal)"),
  proteinG: z.number().describe("Total protein grams"),
  carbsG: z.number().describe("Total carbohydrate grams"),
  fatG: z.number().describe("Total fat grams"),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("Confidence in the estimate"),
  notes: z
    .string()
    .describe("Brief caveats, e.g. hidden oils or uncertain portion"),
});

export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;

const SYSTEM_PROMPT = `You are a nutrition analyst for a calorie-tracking app.
Estimate macronutrients from a food photo and/or text description.
Use common nutritional databases (USDA-style) and typical restaurant/home cooking assumptions.
If a kitchen scale is visible, use the weight shown.
Prefer realistic cooked weights. Call out uncertainty in notes.
Always return totals for the whole meal as eaten.`;

export async function analyzeMeal(input: {
  description?: string;
  imageDataUrl?: string;
  mealTypeHint?: "breakfast" | "lunch" | "dinner" | "snack";
}): Promise<MealAnalysis> {
  if (!process.env.XAI_API_KEY) {
    throw new Error(
      "XAI_API_KEY is not set. Add it to .env.local to enable Grok vision analysis.",
    );
  }

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string | URL }
  > = [];

  const hint = input.mealTypeHint
    ? `Preferred meal type if ambiguous: ${input.mealTypeHint}.`
    : "";
  const desc = input.description?.trim() || "";

  content.push({
    type: "text",
    text: [
      "Analyze this meal and estimate calories, protein, carbs, and fat.",
      hint,
      desc ? `User description: ${desc}` : "No text description provided — rely on the image.",
      "If both image and description are present, reconcile them.",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (input.imageDataUrl) {
    content.push({
      type: "image",
      image: input.imageDataUrl,
    });
  }

  if (!input.imageDataUrl && !desc) {
    throw new Error("Provide a photo and/or a description of the meal.");
  }

  const modelId = process.env.XAI_MEAL_MODEL || "grok-4";

  const { object } = await generateObject({
    model: xai.responses(modelId),
    schema: mealAnalysisSchema,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  return object;
}
