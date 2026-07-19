import { getGoalsWithProgress } from "@/server/goals";
import { PageHeader } from "@/components/PageHeader";
import { GoalsClient } from "@/components/goals/GoalsClient";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const goals = await getGoalsWithProgress();
  return (
    <>
      <PageHeader title="Goals" back="/profile" subtitle="Weekly targets" />
      <GoalsClient goals={goals} />
    </>
  );
}
