// import { serve, ServerRequest } from "https://deno.land/std@0.84.0/http/server.ts";
import { serve, ServerRequest } from "./lib/instrumented/http-server.ts";

import { OpenMetric } from './lib/specification.ts';
import { DefaultRegistry } from './lib/registry.ts';

import './lib/deno-metrics.ts';
import './lib/linux-metrics.ts';

export * from './lib/specification.ts';
export * from './lib/registry.ts';
export * from './lib/deno-metrics.ts';

export function runMetricsServer(opts?: Pick<Deno.ListenOptions, "port" | "hostname">, registry = DefaultRegistry) {
  // TODO: tag our server as 'metrics' somehow
  const server = serve(opts ?? { port: 9090 });

  // go work the server on its own
  (async function() {
    for await (const req of server) {

      if (req.url === '/metrics' && req.method === 'GET') {
        respondToScrape(req, registry.scrapeMetrics());
        continue;
      }

      req.respond({ status: 404, body: "Not Found\n" });
    }
  }());

  return server;
}

export function respondToScrape(req: ServerRequest, stream: Generator<OpenMetric>) {
  const {text, contentType} = DefaultRegistry.buildScrapeText(req.headers.get('user-agent'));

  req.respond({
    body: text,
    headers: new Headers({
      'content-type': contentType,
    }),
  });
}
