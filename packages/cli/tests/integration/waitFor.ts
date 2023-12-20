export async function waitFor(condition: () => Promise<boolean> | boolean, timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timeout (${Date.now() - start} ms)`);
}
