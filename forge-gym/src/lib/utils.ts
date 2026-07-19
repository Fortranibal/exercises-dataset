import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleCase(value: string): string {
  if (!value) return "";
  return value
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Format a weight value, trimming trailing zeros (e.g. 60, 62.5). */
export function fmtWeight(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(2)).toString();
}

/** Compact number formatting for stat cards (e.g. 12.3k). */
export function fmtCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return Number(value.toFixed(value % 1 === 0 ? 0 : 1)).toString();
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat("en").format(Math.round(value));
}

/** Volume = weight x reps, summed. Returned in kg. */
export function fmtVolume(value: number): string {
  return `${fmtCompact(value)} kg`;
}

export function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
