"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  ChartColumn,
  Dumbbell,
  Flame,
  PersonStanding,
  UtensilsCrossed,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Today", icon: Flame },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", icon: ChartColumn },
  { href: "/mmp", label: "MMP", icon: PersonStanding },
  { href: "/strength", label: "Strength", icon: Dumbbell },
  { href: "/physique", label: "Physique", icon: Camera },
  { href: "/settings", label: "Profile", icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--ink)] shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_25%,transparent)] transition group-hover:scale-[1.03]"
            aria-hidden
          >
            <Flame className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="flex items-baseline gap-2.5">
            <span className="font-display text-[1.65rem] tracking-tight text-[var(--highlight)]">
              Forge Meals
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--mute)] sm:inline">
              fuel · track
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition",
                  active
                    ? "bg-white/[0.08] text-[var(--primary)]"
                    : "text-[var(--mute)] hover:bg-white/[0.04] hover:text-[var(--highlight)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.04] px-2 py-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px]",
                active
                  ? "bg-white/[0.08] text-[var(--primary)]"
                  : "text-[var(--mute)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
