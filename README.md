# deno-openmetrics_exporter
OpenMetrics / Prometheus metrics exporting for Deno's runtime

## Example

It's pretty typical to run a Prometheus exporter on its own dedicated port
to keep it separate from whatever API you may be hosting.
Or if you aren't hosting an API at all, you may not already have any HTTP server.

Here's an example of that:

```typescript
import { runMetricsServer } from "https://raw.githubusercontent.com/cloudydeno/deno-openmetrics_exporter/main/mod.ts";

runMetricsServer({ port: 9090 });
console.log("Now serving http://localhost:9090/metrics");
```

You can also run the demo directly, which simulates extra HTTP traffic to make the metrics more full:

`deno run --allow-net https://raw.githubusercontent.com/cloudydeno/deno-openmetrics_exporter/main/demo.ts`

If you would like to expose metrics on your existing web server,
you'll want to look at `mod.ts` for inspiration instead of importing it as-is.

## Metrics

* `deno_ops_dispatched`: # of operations started, split into 3 categories
* `deno_ops_completed`: # of operations finished, split into 3 categories
* `deno_ops_sent_bytes_total`: # of *data* bytes dispatched with all operations so far
* `deno_ops_sent_control_bytes`: # of *control* bytes dispatched with all operations so far
    * [Note from Deno's source code](bytes_todo_note):
      > The 'bytes' metrics seem pretty useless, especially now that the
      > distinction between 'control' and 'data' buffers has become blurry.
* `deno_ops_received_bytes`: # of bytes received in response to an operation so far
* `deno_open_resources`: # of currently registered Deno resources, split by resource type.
    * A process starts up with 3: `stdin`, `stdout`, `err`.
    * Starting the metrics server will add 1 `tcpListener`.
    * Your metrics HTTP request seemingly always shows up as an additional `tcpStream`.
    * All other resources are from your application's own code (or libraries in use).

Please note that the `ops_..._bytes` metrics refer to bytes transfered within your process,
between Javascript and the actual Deno runtime.
They are not directly related to bytes transfered over the network or similar metrics.
You'll want to monitor network bytes from a lower level source such as Docker or Kubernetes metrics
if that is an interesting metric to you.

Here's an example of the payload:

```
# TYPE deno_ops_dispatched counter
deno_ops_dispatched_total{op_type="sync"} 179
deno_ops_dispatched_total{op_type="async"} 252
deno_ops_dispatched_total{op_type="async_unref"} 0
# TYPE deno_ops_completed counter
deno_ops_completed_total{op_type="sync"} 179
deno_ops_completed_total{op_type="async"} 245
deno_ops_completed_total{op_type="async_unref"} 0
# TYPE deno_ops_sent_bytes counter
# UNIT deno_ops_sent_bytes bytes
deno_ops_sent_bytes_total 1214641
# TYPE deno_ops_sent_control_bytes counter
# UNIT deno_ops_sent_control_bytes bytes
deno_ops_sent_control_bytes_total 13178
# TYPE deno_ops_received_bytes counter
# UNIT deno_ops_received_bytes bytes
deno_ops_received_bytes_total 23640
# TYPE deno_open_resources gauge
deno_open_resources{res_type="stdin"} 1
deno_open_resources{res_type="stdout"} 1
deno_open_resources{res_type="stderr"} 1
deno_open_resources{res_type="tcpListener"} 1
deno_open_resources{res_type="child"} 30
deno_open_resources{res_type="tcpStream"} 2
```

## TODO

* [x] Serve data from `Deno.metrics()`
* [x] Serve data from `Deno.resources()`
* [ ] Accept custom metrics from the user's code
* [ ] Include 'created' timestamp on counters to aid in monotonic tracking
* [ ] Publish on deno.land
* [ ] Keep track of previous metrics to include zero gauges in future bodies

## License

MIT

[bytes_todo_note]: https://github.com/denoland/deno/blob/2b75a1155906613df16bad9d1eb84f3dc0ba571b/runtime/metrics.rs#L84
