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
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0c1110]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-[#e8f0ea]">
            caltrack
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#7a9a82] opacity-80 transition group-hover:opacity-100">
            fuel · form · force
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
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
                    ? "bg-[#1a2e22] text-[#9fe870]"
                    : "text-[#9aada0] hover:bg-white/5 hover:text-[#e8f0ea]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-2 py-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px]",
                active ? "text-[#9fe870]" : "text-[#7a8f80]",
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
