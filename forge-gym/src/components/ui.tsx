import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-strong active:scale-[0.98]",
  secondary: "bg-elevated2 text-fg hover:bg-line border border-line",
  ghost: "text-muted hover:text-fg hover:bg-elevated",
  outline: "border border-line-strong text-fg hover:bg-elevated",
  danger: "bg-danger text-white hover:opacity-90 active:scale-[0.98]",
  success: "bg-success text-black font-semibold hover:opacity-90 active:scale-[0.98]",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg justify-center",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:pointer-events-none select-none",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(function Button({ variant, size, className, ...props }, ref) {
  return <button ref={ref} className={buttonClass(variant, size, className)} {...props} />;
});

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-surface border border-line rounded-2xl", className)}
      {...props}
    />
  );
}

/* ----------------------------------- Chip ---------------------------------- */

export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
        active
          ? "bg-accent text-accent-fg border-accent"
          : "bg-elevated text-muted border-line hover:text-fg hover:border-line-strong",
        className,
      )}
      {...props}
    />
  );
}

/* ----------------------------------- Badge --------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "danger" | "warning";
  className?: string;
}) {
  const tones = {
    neutral: "bg-elevated2 text-muted",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-elevated2 text-warning",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------- Stat ---------------------------------- */

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-surface border border-line rounded-2xl p-4", className)}>
      <div className="text-xs text-subtle font-medium uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub != null && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

/* -------------------------------- SectionTitle ------------------------------ */

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{title}</h2>
      {action}
    </div>
  );
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="mb-4 h-14 w-14 rounded-2xl bg-elevated flex items-center justify-center text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ----------------------------------- Input --------------------------------- */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl bg-elevated border border-line px-3 text-sm text-fg placeholder:text-subtle outline-none focus:border-accent transition-colors",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-elevated border border-line px-3 py-2 text-sm text-fg placeholder:text-subtle outline-none focus:border-accent transition-colors resize-none",
        className,
      )}
      {...props}
    />
  );
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium text-muted mb-1.5", className)}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 rounded-full border-2 border-line border-t-accent animate-spin",
        className,
      )}
    />
  );
}
