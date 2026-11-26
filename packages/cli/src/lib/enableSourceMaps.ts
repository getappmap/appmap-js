// Report stack traces against the TypeScript sources, using the .js.map
// files tsc emits alongside built/. This only affects modules loaded after
// the call, so cli.ts must import this module before anything else.
process.setSourceMapsEnabled(true);
