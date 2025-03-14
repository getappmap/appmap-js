import { PerformanceObserver } from 'node:perf_hooks';

let observer: PerformanceObserver;

export default function observePerformance() {
  if (observer) return;
  observer = new PerformanceObserver((list) => {
    for (const { name, duration } of list.getEntries())
      console.warn(`${name}: ${duration.toFixed(0)} ms`);
  });
  observer.observe({ type: 'measure' });
}
