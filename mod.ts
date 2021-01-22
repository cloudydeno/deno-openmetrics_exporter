import { serve, ServerRequest } from "https://deno.land/std@0.84.0/http/server.ts";

import { buildMetricsResponse, OpenMetric } from './lib/specification.ts';
import { gatherEverything } from './lib/deno-metrics.ts';

export * from './lib/specification.ts';
export * from './lib/deno-metrics.ts';

export function runMetricsServer(opts?: Pick<Deno.ListenOptions, "port" | "hostname">) {
  const server = serve(opts ?? { port: 9090 });

  // go work the server on its own
  (async function() {
    for await (const req of server) {

      if (req.url === '/metrics') {
        respondToScrape(req, gatherEverything());
        continue;
      }

      req.respond({ status: 404, body: "Not Found\n" });
    }
  }());

  return server;
}

export function respondToScrape(req: ServerRequest, stream: Generator<OpenMetric>) {
  // datadog only acceppts prometheus payloads
  if (req.headers.get('user-agent')?.startsWith('Datadog Agent/')) {
    return req.respond(buildMetricsResponse(stream, 'legacy'));
  }

  // prometheus since 2.5.0 (~2018) has supported OpenMetrics
  req.respond(buildMetricsResponse(stream, 'openmetrics'));
}
