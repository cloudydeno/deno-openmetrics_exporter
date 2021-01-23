import { runMetricsServer, MetricsRegistry, scrapeDenoMetrics } from './mod.ts';
import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.84.0/testing/asserts.ts";

function setupMetricServer() {
  const registry = new MetricsRegistry();
  registry.sources.push({
    scrapeMetrics: scrapeDenoMetrics,
  });

  const server = runMetricsServer({ port: 0, hostname: 'localhost' }, registry);
  const {port} = server.listener.addr as Deno.NetAddr;
  const url = `http://localhost:${port}`;
  return {registry, server, url};
}

Deno.test("basics", async () => {
  const {server, url} = setupMetricServer();

  const resp = await fetch(`${url}/metrics`);
  assertEquals(resp.status, 200);
  const lines = await resp.text().then(x => x.split('\n'));
  assertArrayIncludes(lines, [
    'deno_ops_completed_total{op_type="async_unref"} 0',
    '# TYPE deno_ops_sent_bytes counter',
    '# UNIT deno_ops_sent_bytes bytes',
    'deno_open_resources{res_type="stdin"} 1',
    'deno_open_resources{res_type="tcpListener"} 1',
    '# EOF',
  ]);

  server.close();
});

Deno.test("datadog compatibility", async () => {
  const {server, url} = setupMetricServer();

  const resp = await fetch(`${url}/metrics`, {
    headers: {
      'User-Agent': 'Datadog Agent/0.0.0',
    }});
  const lines = await resp.text().then(x => x.split('\n'));
  assertArrayIncludes(lines, [
    'deno_ops_completed_total{op_type="async_unref"} 0',
    '# TYPE deno_ops_sent_bytes_total counter',
  ]);

  server.close();
});

Deno.test("no root route", async () => {
  const {server, url} = setupMetricServer();

  const resp = await fetch(`${url}/not-found`);
  assertEquals(resp.status, 404);
  await resp.text();

  server.close();
});
