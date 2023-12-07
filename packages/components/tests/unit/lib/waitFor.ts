export function waitFor<T>(fn: () => Promise<T>, intervalMs = 2, maxMs = 50): Promise<T> {
  return new Promise((resolve, reject) => {
    let keepTrying = true;
    setTimeout(() => (keepTrying = false), maxMs);

    const doTry = async function () {
      try {
        resolve(await fn());
      } catch (err) {
        if (keepTrying) setTimeout(doTry, Math.round(intervalMs * 1.5));
        else reject(err);
      }
    };

    doTry();
  });
}
