import { OpenMetric } from '../types.ts';
import { DefaultRegistry } from '../registry.ts';

const seenResources = new Set<string>();

export function* scrapeDenoMetrics() {
  yield* buildDenoOpsMetrics(Deno.metrics());
  yield* buildDenoResMetrics(Deno.resources());
}

// Always register us in the default registry
DefaultRegistry.sources.push({
  scrapeMetrics: scrapeDenoMetrics,
});

export function* buildDenoOpsMetrics(metrics: Deno.Metrics): Generator<OpenMetric> {
  yield {
    prefix: 'deno_ops_dispatched',
    type: 'counter',
    values: new Map([
      ['_total{op_type="sync"}', metrics.opsDispatchedSync],
      ['_total{op_type="async"}', metrics.opsDispatchedAsync],
      ['_total{op_type="async_unref"}', metrics.opsDispatchedAsyncUnref],
    ])};
  yield {
    prefix: 'deno_ops_completed',
    type: 'counter',
    values: new Map([
      ['_total{op_type="sync"}', metrics.opsCompletedSync],
      ['_total{op_type="async"}', metrics.opsCompletedAsync],
      ['_total{op_type="async_unref"}', metrics.opsCompletedAsyncUnref],
    ])};

  yield {
    prefix: 'deno_ops_sent_bytes',
    type: 'counter',
    unit: 'bytes',
    values: new Map([
      ['_total', metrics.bytesSentData],
    ])};
  yield {
    prefix: 'deno_ops_sent_control_bytes',
    type: 'counter',
    unit: 'bytes',
    values: new Map([
      ['_total', metrics.bytesSentControl], // TODO: Seems like this is a subset of 'sent data' but currently unclear
    ])};
  yield {
    prefix: 'deno_ops_received_bytes',
    type: 'counter',
    unit: 'bytes',
    values: new Map([
      ['_total', metrics.bytesReceived],
    ])};
}

export function* buildDenoResMetrics(resources: Deno.ResourceMap): Generator<OpenMetric> {
  // Seed our map with all relevant zeros
  const typeCounts = new Map<string, number>(Array
    .from(seenResources).map(x => [x, 0]));

  for (const rawResource of Object.values(resources) as unknown[]) {
    const resType = typeof rawResource == 'string' ? rawResource : 'unknown';
    const resMetric = `{res_type=${JSON.stringify(resType)}}`;

    let existing = typeCounts.get(resMetric);
    if (existing == null) {
      existing = 0;
      typeCounts.set(resMetric, existing);
      seenResources.add(resMetric);
    }
    typeCounts.set(resMetric, existing + 1);
  }

  yield {
    prefix: 'deno_open_resources',
    type: 'gauge',
    values: typeCounts,
  };
}
