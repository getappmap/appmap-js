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

# Shaping commits

PRs here are reviewed commit by commit. Shape the history so that each commit can be read and reviewed on its own.

- **One logical change per commit.** A PR that closes several issues or adds several options should normally be several commits, about one per issue or option. Don't make one commit whose body is a bulleted list of unrelated changes. If the body needs a list of separate topics, split the commit.
- **Refactor first, then change behaviour.** If a feature needs code moved, extracted or wrapped, commit that first as a no-op (`refactor: …`, and say "no behaviour change"), then put the feature on top. Avoid re-indenting large blocks, for example by wrapping a whole function body in a new closure or `try`. Whitespace churn hides the real change. Prefer a structure that leaves the existing lines where they are.
- **Pre-existing bugs get their own `fix:` commit**, before the feature that exposed them. That includes hardening, such as replacing shell-string `exec` with `execFile`.
- **Format changes to lines you didn't otherwise touch** (for example after a prettier upgrade) belong in their own commit, or nowhere.
- **Tests go in the commit whose behaviour they test.**
- **Each commit should build and pass `yarn verify`**, so put prerequisites first.
- **Review fixes go to the commit they belong to,** not into one "address review comments" commit covering several topics. `git commit --fixup=<sha>` is handy for this, and `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash <base>` squashes the fixups without an interactive editor. If a fix changes what the original commit does or why, update that commit's message too, for example with `--fixup=amend:<sha>`. Then the message still describes the code.
- If a change really can't be split, say why in the PR description.

## Commit messages

- **Subject:** use Conventional Commits, and capitalize the first word after the tag: `fix(cli): Restore archives whose paths contain spaces`, not `fix(cli): restore …`. Older history doesn't always do this; follow it anyway.
- **`feat:`, `fix:` and `perf:` subjects are published.** semantic-release copies them into each package's `CHANGELOG.md` and the GitHub release notes. Write them for users of the package. Describe the change in behaviour they will see (`fix(cli): Compare no longer crashes on recordings without a recorder type`), not the code change (`fix(cli): Use optional chaining in isTest`).
- **Use `refactor:`, `test:`, `chore:`, `docs:` or `ci:` for changes users can't see.** That includes a fix to a feature that hasn't been released yet. Don't release it as a `fix:` of its own; fold it into the feature commit.
- **Always write a body,** wrapped at about 72 columns. Explain *why*: the problem or motivation, what was wrong before, and why you chose this approach over the obvious alternatives. Mention anything a future reader of `git blame` would need, such as compatibility concerns, changed formats, or behaviour that changed on purpose. Don't restate the diff file by file; the diff already shows that. End with `Fixes #NNN` where it applies.
- **Attribute AI assistance with an `Assisted-by:` trailer**, as described in the [Linux kernel guidance](https://docs.kernel.org/process/coding-assistants.html). Name the agent and the exact model, with no space in the agent name: `Assisted-by: Claude:claude-opus-4-8`. This applies when a human directed the work and the agent helped significantly, for example with design, implementation or debugging. Use it instead of the `Co-Authored-By:` trailer that some agents add by default. When an agent works autonomously, with no human steering it, it can use `Co-Authored-By:` or commit as the author itself, whichever its setup normally does. Leave the trailer off commits the agent only staged or committed for you.
