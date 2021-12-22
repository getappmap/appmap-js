export const waitUntil = (
  condition: () => boolean,
  timeoutMessage?: string
) => {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (!condition()) {
        return;
      }
      clearInterval(interval);
      resolve();
    }, 100);

    if (timeoutMessage) {
      setTimeout(() => {
        clearInterval(interval);
        reject(timeoutMessage);
      }, 1000);
    }
  });
};
