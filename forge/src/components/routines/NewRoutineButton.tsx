"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { createRoutine } from "@/server/actions/routines";

export function NewRoutineButton({
  variant = "icon",
}: {
  variant?: "icon" | "full";
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function create() {
    setBusy(true);
    const res = await createRoutine();
    if (res.ok && res.data) {
      router.push(`/routines/${res.data.id}`);
    } else {
      setBusy(false);
    }
  }

  if (variant === "full") {
    return (
      <Button onClick={create} disabled={busy}>
        <Plus size={16} /> {busy ? "Creating…" : "New routine"}
      </Button>
    );
  }

  return (
    <Button size="icon" onClick={create} disabled={busy} aria-label="New routine">
      <Plus size={18} />
    </Button>
  );
}
