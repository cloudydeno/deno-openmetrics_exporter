import { serve } from "https://deno.land/std@0.84.0/http/server.ts";

import { buildMetricsResponse } from './metrics/specification.ts';
import { gatherEverything } from './metrics/deno-metrics.ts';

export async function runMetricsServer(opts?: Pick<Deno.ListenOptions, "port" | "hostname">) {
  const server = serve(opts ?? { port: 9090 });

  for await (const req of server) {

    if (req.url === '/metrics') {
      req.respond(buildMetricsResponse(gatherEverything()));
      continue;
    }

    req.respond({ status: 404, body: "Not Found\n" });
  }
}
