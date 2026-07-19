import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { mediaUrl } from "@/lib/exercise";
import { titleCase } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ExerciseListItem } from "@/server/exercises";

export function ExerciseThumb({
  image,
  name,
  size = 56,
  rounded = "rounded-xl",
}: {
  image: string | null;
  name: string;
  size?: number;
  rounded?: string;
}) {
  const url = mediaUrl(image);
  return (
    <div
      className={cn("relative overflow-hidden bg-elevated2 shrink-0", rounded)}
      style={{ height: size, width: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={titleCase(name)}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-subtle">
          <Dumbbell size={size * 0.4} />
        </div>
      )}
    </div>
  );
}

export function ExerciseRow({
  item,
  href,
  onClick,
  trailing,
  selected,
}: {
  item: ExerciseListItem;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  selected?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors w-full text-left",
        selected ? "bg-accent-soft border border-accent" : "hover:bg-elevated border border-transparent",
      )}
    >
      <ExerciseThumb image={item.image} name={item.name} />
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{titleCase(item.name)}</div>
        <div className="text-xs text-muted truncate capitalize">
          {item.target || item.bodyPart}
          {item.equipment ? ` · ${item.equipment}` : ""}
        </div>
      </div>
      {trailing}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block w-full">
      {inner}
    </button>
  );
}
