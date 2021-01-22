// https://github.com/OpenObservability/OpenMetrics/blob/master/specification/OpenMetrics.md

export type ExpositionFormat = 'openmetrics' | 'legacy';
export const ContentTypes = {
  openmetrics: 'application/openmetrics-text; version=1.0.0; charset=utf-8',
  legacy: 'text/plain; version=0.0.4',
};

export function buildMetricsPayload(source: Generator<OpenMetric>, fmt: ExpositionFormat) {
  const accum = new Array<string>();
  for (let {prefix, type, unit, help, values} of source) {

    // Downgrade counters for original prometheus requests
    if (fmt === 'legacy' && type === 'counter') {
      // the _total part moves up a level and non-_total metrics are stripped
      prefix += '_total';
      values = new Map(Array.from(values)
        .filter(x => x[0].startsWith('_total'))
        .map(x => [x[0].slice('_total'.length), x[1]]));
    }

    accum.push(`# TYPE ${prefix} ${type}\n`);
    if (unit && fmt === 'openmetrics') accum.push(`# UNIT ${prefix} ${unit}\n`);
    if (help) accum.push(`# HELP ${prefix} ${help}\n`);
    for (const point of values) {
      accum.push(`${prefix}${point[0]} ${point[1]}\n`)
    }
  }
  if (fmt === 'openmetrics') accum.push(`# EOF\n`);
  return accum.join('');
}

export function buildMetricsResponse(source: Generator<OpenMetric>, fmt: ExpositionFormat) {
  return {
    body: buildMetricsPayload(source, fmt),
    headers: new Headers({
      'content-type': ContentTypes[fmt],
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
