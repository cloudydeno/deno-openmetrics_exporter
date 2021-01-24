import { serve, Server } from "../../lib/instrumented/http-server.ts";
import { DefaultRegistry } from "../../mod.ts";

import { Drash } from "https://deno.land/x/drash@v1.4.0/mod.ts";
class InstrumentableDrashServer extends Drash.Http.Server {
  public listenOnServer(server: Server) {
    this.deno_server = server;
    return this.listen();
  }
}

const server = new InstrumentableDrashServer({
  response_output: "text/html",
  resources: [

    class HomeResource extends Drash.Http.Resource {
      static paths = ["/"];
      public GET() {
        this.response.body = "Hello World!";
        return this.response;
      }
    },

    class SlowLoadingResource extends Drash.Http.Resource {
      static paths = ["/slow-loading"];
      public async GET() {
        const millis = Math.round(1000 * (2 + Math.random() * 5));
        await new Promise(ok => setTimeout(ok, millis));
        this.response.body = `Phew, that took ${millis}ms!`;
        return this.response;
      }
    },

    class MetricsResource extends Drash.Http.Resource {
      static paths = ["/metrics"];
      public GET() {
        const {text, contentType} = DefaultRegistry
          .buildScrapeText(this.request.headers.get('user-agent'));
        this.response.body = text;
        this.response.headers.set('content-type', contentType);
        return this.response;
      }
    },

  ],
});

server.listenOnServer(serve({
  hostname: "127.0.0.1",
  port: 1447,
}));
console.log('Running on port 1447');
