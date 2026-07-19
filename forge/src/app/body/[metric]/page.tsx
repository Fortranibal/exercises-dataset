import { notFound } from "next/navigation";
import { isBodyMetricKey } from "@/lib/body-metrics";
import { getMetricDetail } from "@/server/body";
import { PageHeader } from "@/components/PageHeader";
import { BodyMetricDetail } from "@/components/body/BodyMetricDetail";

export const dynamic = "force-dynamic";

export default async function BodyMetricPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric } = await params;
  if (!isBodyMetricKey(metric)) notFound();

  const detail = await getMetricDetail(metric);
  return (
    <>
      <PageHeader title={detail.label} back="/body" subtitle="Trend & history" />
      <BodyMetricDetail detail={detail} />
    </>
  );
}
