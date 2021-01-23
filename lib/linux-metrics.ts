import { OpenMetric } from './specification.ts';
import { DefaultRegistry } from './registry.ts';

// Always register us in the default registry
DefaultRegistry.sources.push({
  scrapeMetrics: collectLinuxMetrics,
});

export function* collectLinuxMetrics(): Generator<OpenMetric> {

  try {
    const fds = Deno.readDirSync("/proc/self/fd");
    let count = -1; // disregard our own fd from reading the dir
    for (const _ of fds) {
      count++;
    }

    yield {
      prefix: 'process_open_fds',
      type: 'gauge',
      help: 'Number of open file descriptors.',
      singleValue: count};

  } catch {}

  try {
    const limits = Deno.readTextFileSync('/proc/self/limits');
    const lines = limits.split('\n');
    let maxFds = -1;
    for (const line of lines) {
      if (line.startsWith('Max open files')) {
        const parts = line.split(/  +/);
        maxFds = parseInt(parts[1]);
        break;
      }
    }

    if (maxFds >= 0) yield {
      prefix: 'process_max_fds',
      type: 'gauge',
      help: 'Maximum number of open file descriptors.',
      singleValue: maxFds};

  } catch {}

}
