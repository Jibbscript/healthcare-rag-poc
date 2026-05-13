export type EmfMetric = { name: string; unit: string; value: number };

export function buildEmf(input: { namespace: string; dimensions: Record<string, string>; metrics: EmfMetric[]; timestamp?: number }): Record<string, unknown> {
  return {
    _aws: {
      Timestamp: input.timestamp ?? Date.now(),
      CloudWatchMetrics: [{ Namespace: input.namespace, Dimensions: [Object.keys(input.dimensions)], Metrics: input.metrics.map((metric) => ({ Name: metric.name, Unit: metric.unit })) }]
    },
    ...input.dimensions,
    ...Object.fromEntries(input.metrics.map((metric) => [metric.name, metric.value]))
  };
}

export function assertNoPiiInLogObject(value: unknown): boolean {
  const text = JSON.stringify(value);
  return !/\b\d{3}-\d{2}-\d{4}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|member\s*id/i.test(text);
}
