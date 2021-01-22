import { runMetricsServer } from './mod.ts';

runMetricsServer({ port: 9090 });
console.log('Now serving http://localhost:9090/metrics');

// Hit ourselves to simulate continuous traffic over time
setInterval(() => {
  fetch('http://localhost:9090').then(x => x.text());
}, 1000);
