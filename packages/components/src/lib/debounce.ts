/*
This implementation will throttle the function call to once every `throttleMs` milliseconds.
If the function is called again within the timeout period, it will be called again after the timeout period.
*/
export default function debounce(fn: Function, throttleMs: number | (() => number)) {
  let calledOnCooldown = false;
  let timeout: unknown | undefined;

  function performCallback() {
    const resolvedThrottleMs = typeof throttleMs === 'function' ? throttleMs() : throttleMs;
    calledOnCooldown = false;
    timeout = setTimeout(() => {
      timeout = undefined;
      if (calledOnCooldown) performCallback();
    }, resolvedThrottleMs);
    fn();
  }

  return () => {
    if (timeout) {
      calledOnCooldown = true;
    } else {
      performCallback();
    }
  };
}
