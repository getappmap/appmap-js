# Verifying changes

This is a Yarn 3 monorepo (`packages/*`). CI rejects pushes for both lint errors and tsc errors, with several-minute round-trip costs per CI run. Verify locally before committing.

## When to run verify

After any **substantial batch of changes** — multiple files touched, new functions added, tests added, refactors — run `yarn verify` from the repo root before reporting work complete or asking to commit. A one-line typo fix doesn't need it; a multi-file change does.

## How to run verify

```sh
yarn verify           # check working-tree changes (staged + unstaged + untracked)
yarn verify:staged    # check only staged changes
```

`scripts/verify.mjs`:

1. Reads modified files from git.
2. Groups them by `packages/<name>/`.
3. For each affected package: runs ESLint (`--quiet`, errors only) on the changed lintable files, then `tsc --noEmit` on the whole package (since TS is project-wide, you can't typecheck a single file).

Typical run on one package: ~5–7s. CI's full lint+typecheck takes ~30s; scoped is ~3× faster.

## Adding verify to a package

If you touch a package that doesn't yet participate, add a `typecheck` script (`tsc --noEmit`) to its `package.json` so `verify.mjs` includes it. The existing `lint` script is enough for ESLint coverage.

## What verify catches

- ESLint errors that CI rejects: `array-type` (use `T[]` not `Array<T>`), `no-unnecessary-type-assertion`, `prefer-function-type`, `prefer-optional-chain`, etc. Warnings (e.g. `no-unsafe-*`, `prefer-nullish-coalescing`) are suppressed by `--quiet`.
- Type errors that `tsc --noEmit` finds, including yargs `CommandModule<T, any>` assignability issues that require widening exported handler argv types.

# Driving the MCP after MCP-side changes

The `appmap query mcp` server lives in `built/cli.js`. If you change anything under `packages/cli/src/cmds/query/queries/mcp.ts` (or anywhere it transitively imports), you must run `npx tsc` (or `yarn build`) inside `packages/cli` before launching `mcp` for ad-hoc testing. A stale binary will respond to `tools/list` with the old surface — symptom is usually `unknown tool: …` from a client driving a tool the source defines.

# Recording with appmap-node from a monorepo

`npx appmap-node@latest npx jest …` invoked from the repo root can fail to parse `.ts` test files with a babel SyntaxError, because the inner jest doesn't pick up `packages/<name>/jest.config.js`'s `ts-jest` preset. Run from the package directory whose preset matters — e.g. `cd packages/cli && npx appmap-node@latest npx jest …`.
