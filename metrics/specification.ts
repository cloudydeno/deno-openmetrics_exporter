// https://github.com/OpenObservability/OpenMetrics/blob/master/specification/OpenMetrics.md

export const ContentType = 'application/openmetrics-text; version=1.0.0; charset=utf-8';

export function buildMetricsPayload(source: Generator<OpenMetric>) {
  const accum = new Array<string>();
  for (const metric of source) {
    accum.push(`# TYPE ${metric.prefix} ${metric.type}\n`);
    if (metric.unit) accum.push(`# UNIT ${metric.prefix} ${metric.unit}\n`);
    if (metric.help) accum.push(`# HELP ${metric.prefix} ${metric.help}\n`);
    for (const point of metric.values) {
      accum.push(`${metric.prefix}${point[0]} ${point[1]}\n`)
    }
  }
  return accum.join('');
}

export function buildMetricsResponse(source: Generator<OpenMetric>) {
  return {
    body: buildMetricsPayload(source),
    headers: new Headers({
      'content-type': ContentType,
    }),
  }
}

export interface OpenMetric {
  prefix: string;
  type: string;
  unit?: string;
  help?: string;
  values: Map<string, number | string>;
}
