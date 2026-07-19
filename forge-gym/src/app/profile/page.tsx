import Link from "next/link";
import { Ruler, Target, CalendarDays, Dumbbell, ChevronRight, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/body", icon: Ruler, title: "Body measurements", desc: "Weight, body fat, circumferences" },
  { href: "/goals", icon: Target, title: "Goals", desc: "Weekly training targets" },
  { href: "/history", icon: CalendarDays, title: "Workout history", desc: "Calendar & past sessions" },
  { href: "/exercises", icon: Dumbbell, title: "Exercises", desc: "Library & custom exercises" },
];

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" />
      <div className="px-4 py-4 space-y-3">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href}>
              <Card className="p-4 flex items-center gap-3 hover:bg-elevated transition-colors">
                <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted">{l.desc}</div>
                </div>
                <ChevronRight size={18} className="text-subtle shrink-0" />
              </Card>
            </Link>
          );
        })}

        <a href="/api/export" download>
          <Card className="p-4 flex items-center gap-3 hover:bg-elevated transition-colors">
            <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
              <Download size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">Export data</div>
              <div className="text-xs text-muted">Download all your data as JSON</div>
            </div>
            <ChevronRight size={18} className="text-subtle shrink-0" />
          </Card>
        </a>
      </div>
    </>
  );
}
