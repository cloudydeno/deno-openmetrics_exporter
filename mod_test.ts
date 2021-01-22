import { runMetricsServer } from './mod.ts';
import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.84.0/testing/asserts.ts";

Deno.test("basics", async () => {
  const server = runMetricsServer({ port: 9093, hostname: 'localhost' });

  const resp = await fetch('http://localhost:9093/metrics');
  assertEquals(resp.status, 200);
  const lines = await resp.text().then(x => x.split('\n'));
  assertArrayIncludes(lines, [
    '# TYPE deno_ops_sent_bytes counter',
    '# UNIT deno_ops_sent_bytes bytes',
    'deno_open_resources{res_type="stdin"} 1',
    'deno_open_resources{res_type="tcpListener"} 1',
    '# EOF',
  ]);

  server.close();
});

Deno.test("datadog compatibility", async () => {
  const server = runMetricsServer({ port: 9093, hostname: 'localhost' });

  const resp = await fetch('http://localhost:9093/metrics', {
    headers: {
      'User-Agent': 'Datadog Agent/0.0.0',
    }});
  const lines = await resp.text().then(x => x.split('\n'));
  assertArrayIncludes(lines, [
    '# TYPE deno_ops_sent_bytes_total counter',
  ]);

  server.close();
});

Deno.test("no root route", async () => {
  const server = runMetricsServer({ port: 9093, hostname: 'localhost' });

  const resp = await fetch('http://localhost:9093');
  assertEquals(resp.status, 404);
  await resp.text();

  server.close();
});
