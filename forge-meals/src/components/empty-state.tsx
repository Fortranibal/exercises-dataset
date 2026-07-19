import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, hint, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "panel flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-display text-xl text-[var(--highlight)]">{title}</p>
      {hint ? (
        <p className="max-w-sm text-sm text-[var(--mute)]">{hint}</p>
      ) : null}
      {action}
    </div>
  );
}
