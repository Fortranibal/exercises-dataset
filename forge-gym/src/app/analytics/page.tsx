import { PageHeader } from "@/components/PageHeader";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Your training breakdown" />
      <AnalyticsDashboard />
    </>
  );
}
