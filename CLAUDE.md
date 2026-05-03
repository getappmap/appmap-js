# Verifying changes

This is a Yarn 3 monorepo (`packages/*`). CI rejects pushes for both lint errors and tsc errors, and round-trip cost is several minutes per CI run. Verify locally before committing.

## When to run verify

After any **substantial batch of changes** to a package — multiple files touched, new functions added, tests added, refactors — run that package's `verify` script before reporting work complete or asking to commit. A one-line typo fix doesn't need it; a multi-file change does.

Run `verify` for **only the packages with modified files**, not the whole monorepo. Full-monorepo lint takes ~30s; a single package's verify is ~10s.

## How to run verify

```sh
# from the package directory:
cd packages/cli && yarn verify
```

`yarn verify` chains `yarn lint && yarn typecheck`. Currently defined in:

- `packages/cli` — `lint` (eslint) + `typecheck` (tsc --noEmit), ~10s total

Other packages don't yet have `verify`. If a package without `verify` is modified, run its `lint` script (and `tsc --noEmit` if it has a tsconfig) manually, or add a `verify` script following the cli pattern.

## What it catches

- ESLint rules: `array-type`, `no-unnecessary-type-assertion`, `prefer-function-type`, `prefer-optional-chain`, `prefer-nullish-coalescing`, etc. — all rejected by CI as errors.
- Type errors that `tsc --noEmit` finds, including yargs `CommandModule<T, any>` assignability issues that require widening exported handler argv types.

## Determining which packages changed

```sh
git diff --name-only HEAD | awk -F/ '/^packages\//{print "packages/"$2}' | sort -u
```

Run `yarn verify` (or fall back to `yarn lint`) in each.
