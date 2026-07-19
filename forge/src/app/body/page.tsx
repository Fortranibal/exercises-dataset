import { getBodyOverview } from "@/server/body";
import { PageHeader } from "@/components/PageHeader";
import { BodyOverview } from "@/components/body/BodyOverview";

export const dynamic = "force-dynamic";

export default async function BodyPage() {
  const overview = await getBodyOverview();
  return (
    <>
      <PageHeader title="Body" back="/profile" subtitle="Measurements & goals" />
      <BodyOverview overview={overview} />
    </>
  );
}
