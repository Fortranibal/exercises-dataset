"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { ExerciseBrowser, type Facets } from "@/components/exercises/ExerciseBrowser";
import { addExerciseToRoutine } from "@/server/actions/routines";
import type { ExerciseListItem } from "@/server/exercises";

export function AddExercisesClient({
  routineId,
  facets,
  existingIds,
}: {
  routineId: string;
  facets: Facets;
  existingIds: string[];
}) {
  const router = useRouter();
  const [added, setAdded] = React.useState<Set<string>>(new Set(existingIds));
  const [count, setCount] = React.useState(0);

  async function onSelect(item: ExerciseListItem) {
    if (added.has(item.id)) return;
    setAdded((prev) => new Set(prev).add(item.id));
    setCount((c) => c + 1);
    await addExerciseToRoutine(routineId, item.id);
  }

  function done() {
    router.push(`/routines/${routineId}`);
    router.refresh();
  }

  return (
    <div className="pb-20">
      <ExerciseBrowser
        facets={facets}
        mode="select"
        selectedIds={[...added]}
        onSelect={onSelect}
      />
      <div className="fixed bottom-24 inset-x-0 px-4 z-30">
        <div className="mx-auto max-w-2xl">
          <Button className="w-full shadow-lg shadow-accent/20" onClick={done}>
            <Check size={18} /> Done{count > 0 ? ` · added ${count}` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
