import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-lg border-b border-line">
      <div className="flex items-center gap-3 px-4 h-14">
        {back && (
          <Link
            href={back}
            className="-ml-2 h-9 w-9 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-elevated transition-colors shrink-0"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
