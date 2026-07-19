"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/exercise";

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
  { code: "tr", label: "TR" },
];

export function InstructionsViewer({
  instructions,
  steps,
}: {
  instructions: Partial<Record<Lang, string>>;
  steps: Partial<Record<Lang, string[]>>;
}) {
  const available = LANGS.filter(
    ({ code }) => (steps[code]?.length ?? 0) > 0 || (instructions[code]?.length ?? 0) > 0,
  );
  const [lang, setLang] = React.useState<Lang>(available[0]?.code ?? "en");

  if (available.length === 0) {
    return <p className="text-sm text-muted">No instructions available for this exercise.</p>;
  }

  const stepList = steps[lang];
  const paragraph = instructions[lang];

  return (
    <div>
      {available.length > 1 && (
        <div className="flex gap-1 mb-3">
          {available.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors",
                lang === code ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {stepList && stepList.length > 0 ? (
        <ol className="space-y-2.5">
          {stepList.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="shrink-0 h-5 w-5 rounded-full bg-accent-soft text-accent text-[11px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-muted">{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{paragraph}</p>
      )}
    </div>
  );
}
