// https://github.com/OpenObservability/OpenMetrics/blob/master/specification/OpenMetrics.md

export type MetricType =
| "unknown"
| "gauge"
| "counter"
| "stateset"
| "info"
| "histogram"
| "gaugehistogram"
| "summary";

export interface MetricMetadata {
  prefix: string;
  type: MetricType;
  unit?: string;
  help?: string;
  singleValue?: number | string;
  values?: Map<string, number | string>;
}

export type OpenMetric = MetricMetadata & ({
  singleValue: number | string;
  values?: undefined;
} | {
  singleValue?: undefined;
  values: Map<string, number | string>;
});


export type ExpositionFormat = 'openmetrics' | "plaintext" | 'legacy';
export const ContentTypes = {
  openmetrics: 'application/openmetrics-text; version=1.0.0; charset=utf-8',
  legacy: 'text/plain; version=0.0.4',
  plaintext: 'text/plain',
};

export function serializeMetricsPayload(source: Generator<OpenMetric>, fmt: ExpositionFormat) {
  const accum = new Array<string>();
  for (const metric of source) {
    let {prefix, type, unit, help, values} = metric;

    // Downgrade counters for original prometheus requests
    if (fmt === 'legacy' && type === 'counter' && values) {
      // the _total part moves up a level and non-_total metrics are stripped
      prefix += '_total';
      values = new Map(Array.from(values)
        .filter(x => x[0].startsWith('_total'))
        .map(x => [x[0].slice('_total'.length), x[1]]));
    }

    accum.push(`# TYPE ${prefix} ${type}\n`);
    if (unit && fmt !== 'legacy') accum.push(`# UNIT ${prefix} ${unit}\n`);
    if (help) accum.push(`# HELP ${prefix} ${help}\n`);
    if (metric.values) {
      for (const point of values!) {
        accum.push(`${prefix}${point[0]} ${point[1]}\n`)
      }
    } else {
      accum.push(`${prefix} ${metric.singleValue}\n`)
    }
  }
  if (fmt !== 'legacy') accum.push(`# EOF\n`);
  return accum.join('');
}

export function buildExposition(source: Generator<OpenMetric>, fmt: ExpositionFormat) {
  return {
    text: serializeMetricsPayload(source, fmt),
    contentType: ContentTypes[fmt],
  };
}

export function bestFormatForAgent(userAgent?: string | null) {
  // datadog only accepts original prometheus payloads
  if (userAgent?.startsWith('Datadog Agent/')) {
    return 'legacy';
  }

  // give web browsers the modern payload, but as plaintext
  if (userAgent?.startsWith('Mozilla/')) {
    return 'plaintext';
  }

  // prometheus since 2.5.0 (~2018) has supported OpenMetrics
  return 'openmetrics';
}
