// Preload for tests/unit/cliStartup.spec.ts. When the process exits, print
// the path of every module that was loaded, one per line, to stderr.
process.on('exit', () => {
  process.stderr.write(`${Object.keys(require.cache).join('\n')}\n`);
});
