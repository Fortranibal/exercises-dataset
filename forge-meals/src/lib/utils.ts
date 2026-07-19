import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export function asMealType(type: string): MealType {
  switch (type) {
    case "breakfast":
    case "lunch":
    case "dinner":
    case "snack":
      return type;
    default:
      return "snack";
  }
}

export function mealTypeLabel(type: MealType): string {
  switch (type) {
    case "breakfast":
      return "Breakfast";
    case "lunch":
      return "Lunch";
    case "dinner":
      return "Dinner";
    case "snack":
      return "Snack";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
