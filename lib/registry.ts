import { OpenMetric } from './specification.ts';

export interface MetricsSource {
  scrapeMetrics(): Generator<OpenMetric>;
}

export class MetricsRegistry implements MetricsSource {
  sources = new Array<MetricsSource>();

  *scrapeMetrics() {
    for (const source of this.sources) {
      yield* source.scrapeMetrics();
    }
  }

}

// TODO: consider how this would work between different module versions
export const DefaultRegistry = new MetricsRegistry();
