import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LineChart, Dumbbell } from "lucide-react";
import { getExercise } from "@/server/exercises";
import { mediaUrl } from "@/lib/exercise";
import { titleCase } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Card } from "@/components/ui";
import { InstructionsViewer } from "@/components/exercises/InstructionsViewer";
import { DeleteExerciseButton } from "@/components/exercises/DeleteExerciseButton";

export const dynamic = "force-dynamic";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = await getExercise(id);
  if (!exercise) notFound();

  const media = mediaUrl(exercise.gifUrl) ?? mediaUrl(exercise.image);

  return (
    <>
      <PageHeader
        title={titleCase(exercise.name)}
        back="/exercises"
        action={exercise.isCustom ? <DeleteExerciseButton id={exercise.id} /> : undefined}
      />

      <div className="px-4 py-4 space-y-5">
        {/* Media */}
        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-elevated2">
          {media ? (
            <Image
              src={media}
              alt={titleCase(exercise.name)}
              fill
              sizes="(max-width: 640px) 100vw, 384px"
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-subtle">
              <Dumbbell size={64} />
            </div>
          )}
          {exercise.isCustom && (
            <div className="absolute top-3 left-3">
              <Badge tone="accent">Custom</Badge>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge tone="neutral">{titleCase(exercise.bodyPart)}</Badge>
          {exercise.equipment && <Badge tone="neutral">{titleCase(exercise.equipment)}</Badge>}
          {exercise.target && <Badge tone="accent">{titleCase(exercise.target)}</Badge>}
        </div>

        {/* Progress link */}
        <Link href={`/exercises/${exercise.id}/progress`} className="block">
          <Card className="p-4 flex items-center gap-3 hover:bg-elevated transition-colors">
            <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
              <LineChart size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">View progress & records</div>
              <div className="text-xs text-muted">Charts, history, and estimated 1RM</div>
            </div>
          </Card>
        </Link>

        {/* Muscles */}
        {(exercise.target || exercise.secondaryMuscles.length > 0) && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Muscles worked</h3>
            <div className="space-y-3">
              {exercise.target && (
                <div>
                  <div className="text-xs text-subtle mb-1">Primary</div>
                  <Badge tone="accent">{titleCase(exercise.target)}</Badge>
                </div>
              )}
              {exercise.secondaryMuscles.length > 0 && (
                <div>
                  <div className="text-xs text-subtle mb-1">Secondary</div>
                  <div className="flex flex-wrap gap-2">
                    {exercise.secondaryMuscles.map((m) => (
                      <Badge key={m} tone="neutral">
                        {titleCase(m)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Instructions</h3>
          <InstructionsViewer
            instructions={exercise.instructions}
            steps={exercise.instructionSteps}
          />
        </Card>
      </div>
    </>
  );
}
