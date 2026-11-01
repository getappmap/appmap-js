#!/usr/bin/env node
// Mirror the AppMap documentation corpus from the website repo into docs/.
//
// docs/ is not repo documentation: it is the help corpus for `appmap navie help`.
// packages/cli bundles it into built/docs at build time (see the build:doc script)
// and indexes every *.md file it finds (src/cmds/navie/help.ts). The website repo
// getappmap/applandinc.github.io is the source of truth, so docs/ must be an exact
// mirror of its _docs tree — including deleting anything the website has retired.
//
// Usage:
//   node scripts/sync-docs.mjs --source ../applandinc.github.io/_docs
//   node scripts/sync-docs.mjs --source <dir> --dry-run  # report, write nothing
//   node scripts/sync-docs.mjs --source <dir> --check    # exit 1 if docs/ is stale
//   node scripts/sync-docs.mjs --source <dir> --target <dir>
//
// Paths are resolved relative to the working directory; --target defaults to the
// docs/ directory of this repository.
//
// This script deliberately does no git and no network work. Checking the website
// out and opening the pull request is the job of .github/workflows/sync-docs.yml,
// which keeps the mirror itself testable and lets you run a sync by hand onto
// whatever branch you like.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The corpus is defined by what the indexer consumes, and help.ts indexes *.md
// only. Nothing else reads docs/, so website assets in other formats (PDFs, stray
// HTML) would only pad the published npm tarball.
export const EXTENSIONS = ['.md'];

// Source-relative paths to keep out of the corpus even though the website
// publishes them. appmap-agent-js is the retired JavaScript agent; its docs used
// to be dropped after the fact by packages/cli's build:doc script.
export const EXCLUDE = ['reference/appmap-agent-js.md'];

// Files and directories whose name starts with a dot are ignored in both trees,
// so a sync never has to reason about VCS or editor metadata.
const isHidden = (name) => name.startsWith('.');

/**
 * Recursively list files under dir, as paths relative to dir using forward
 * slashes. Returns an empty array if dir does not exist.
 */
export function listFiles(dir, prefix = '') {
  if (!existsSync(dir)) return [];

  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (isHidden(entry.name)) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) results.push(...listFiles(path.join(dir, entry.name), relative));
    else if (entry.isFile()) results.push(relative);
  }
  return results;
}

/** Remove directories that the sync emptied out, deepest first. */
function pruneEmptyDirectories(target, relativePaths) {
  const candidates = new Set();
  for (const relative of relativePaths) {
    let parent = path.posix.dirname(relative);
    while (parent && parent !== '.') {
      candidates.add(parent);
      parent = path.posix.dirname(parent);
    }
  }

  for (const relative of [...candidates].sort((a, b) => b.length - a.length)) {
    const directory = path.join(target, ...relative.split('/'));
    if (existsSync(directory) && readdirSync(directory).length === 0)
      rmSync(directory, { recursive: true });
  }
}

/**
 * Make target an exact mirror of the mirrorable files in source.
 *
 * @returns {{added: string[], updated: string[], deleted: string[], unchanged: string[]}}
 */
export function syncDocs({
  source,
  target,
  dryRun = false,
  extensions = EXTENSIONS,
  exclude = EXCLUDE,
} = {}) {
  if (!existsSync(source)) throw new Error(`Source directory does not exist: ${source}`);

  const excluded = new Set(exclude);
  const mirrorable = (relative) =>
    extensions.includes(path.posix.extname(relative)) && !excluded.has(relative);

  const sourceFiles = listFiles(source).filter(mirrorable);
  const targetFiles = listFiles(target);
  const wanted = new Set(sourceFiles);

  const report = { added: [], updated: [], deleted: [], unchanged: [] };

  for (const relative of sourceFiles) {
    const from = path.join(source, ...relative.split('/'));
    const to = path.join(target, ...relative.split('/'));

    if (!existsSync(to)) report.added.push(relative);
    else if (readFileSync(from).equals(readFileSync(to))) {
      report.unchanged.push(relative);
      continue;
    } else report.updated.push(relative);

    if (dryRun) continue;
    mkdirSync(path.dirname(to), { recursive: true });
    copyFileSync(from, to);
  }

  for (const relative of targetFiles) {
    if (wanted.has(relative)) continue;
    report.deleted.push(relative);
    if (!dryRun) rmSync(path.join(target, ...relative.split('/')));
  }

  if (!dryRun) pruneEmptyDirectories(target, report.deleted);

  return report;
}

function printReport(report, { dryRun }) {
  const changed = ['added', 'updated', 'deleted'];
  for (const kind of changed)
    for (const relative of report[kind]) console.log(`  ${kind.padEnd(7)} ${relative}`);

  const summary = changed.map((kind) => `${report[kind].length} ${kind}`).join(', ');
  console.log(
    `${dryRun ? 'Would sync' : 'Synced'}: ${summary}, ${report.unchanged.length} unchanged`
  );
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        source: { type: 'string' },
        target: { type: 'string', default: path.join(ROOT, 'docs') },
        check: { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
      },
    }));
  } catch (error) {
    console.error(`${error.message}\n`);
    values = undefined;
  }

  if (!values?.source) {
    console.error(
      'Usage: node scripts/sync-docs.mjs --source <website>/_docs [--target docs] [--check] [--dry-run]'
    );
    process.exit(1);
  }

  let source = path.resolve(values.source);
  const target = path.resolve(values.target);
  const dryRun = values['dry-run'] || values.check;

  // common mistake: passing the website root instead of its _docs subdirectory
  if (existsSync(path.join(source, '_docs'))) {
    console.warn(
      `Source directory looks like a website root; using its _docs subdirectory: ${source}/_docs`
    );
    source = path.join(source, '_docs');
  }

  if (!existsSync(source)) {
    console.error(`Source directory does not exist: ${source}`);
    process.exit(1);
  }

  const report = syncDocs({ source, target, dryRun });
  printReport(report, { dryRun });

  const stale = report.added.length + report.updated.length + report.deleted.length > 0;
  if (values.check && stale) {
    console.error(`${target} is not in sync with ${source}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
