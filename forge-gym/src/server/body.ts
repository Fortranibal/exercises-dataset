import { prisma } from "@/lib/prisma";
import {
  BODY_METRICS,
  metricMeta,
  type BodyMetricKey,
  type GoalDirection,
  type MetricGoal,
} from "@/lib/body-metrics";

export type BodyMetricOverview = {
  key: BodyMetricKey;
  label: string;
  unit: string;
  latest: number | null;
  previous: number | null;
  lastDate: string | null;
  count: number;
  goal: MetricGoal | null;
};

export async function getBodyOverview(): Promise<BodyMetricOverview[]> {
  const [all, goals] = await Promise.all([
    prisma.bodyMeasurement.findMany({ orderBy: { measuredAt: "asc" } }),
    prisma.measurementGoal.findMany(),
  ]);
  const goalMap = new Map(goals.map((g) => [g.metricKey, g]));

  return BODY_METRICS.map((metric) => {
    const series = all.filter((m) => m[metric.key] != null);
    const latest = series.length > 0 ? series[series.length - 1] : null;
    const previous = series.length > 1 ? series[series.length - 2] : null;
    const goal = goalMap.get(metric.key);
    return {
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      latest: latest ? (latest[metric.key] as number) : null,
      previous: previous ? (previous[metric.key] as number) : null,
      lastDate: latest ? latest.measuredAt.toISOString() : null,
      count: series.length,
      goal: goal
        ? { target: goal.target, direction: goal.direction as GoalDirection }
        : null,
    };
  });
}

export type MetricPoint = { entryId: string; date: string; value: number };

export type MetricDetail = {
  key: BodyMetricKey;
  label: string;
  unit: string;
  series: MetricPoint[];
  goal: MetricGoal | null;
};

export async function getMetricDetail(key: BodyMetricKey): Promise<MetricDetail> {
  const [all, goal] = await Promise.all([
    prisma.bodyMeasurement.findMany({ orderBy: { measuredAt: "asc" } }),
    prisma.measurementGoal.findUnique({ where: { metricKey: key } }),
  ]);
  const meta = metricMeta(key);
  const series: MetricPoint[] = all
    .filter((m) => m[key] != null)
    .map((m) => ({ entryId: m.id, date: m.measuredAt.toISOString(), value: m[key] as number }));

  return {
    key,
    label: meta.label,
    unit: meta.unit,
    series,
    goal: goal ? { target: goal.target, direction: goal.direction as GoalDirection } : null,
  };
}
