#!/usr/bin/env node
// Run lint + typecheck on packages with modified files.
//
// Usage:
//   node scripts/verify.mjs           # check working-tree changes (staged + unstaged + untracked)
//   node scripts/verify.mjs --staged  # check only staged changes (intended for pre-commit hook use)
//
// Per affected package:
//   1. eslint on the package's changed *.ts / *.tsx / *.js / *.mjs files
//   2. tsc --noEmit on the whole package, if it has tsconfig.json + a typecheck script
//
// Exits non-zero if any check fails. Skips files outside packages/.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAGED = process.argv.includes('--staged');

const LINT_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

function git(...args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`git ${args.join(' ')} failed:\n${r.stderr}`);
    process.exit(1);
  }
  return r.stdout;
}

function modifiedFiles() {
  if (STAGED) {
    // Staged adds/copies/modifies/renames.
    return git('diff', '--cached', '--name-only', '--diff-filter=ACMR')
      .split('\n')
      .filter(Boolean);
  }
  // Working tree: tracked changes + untracked (excluding ignored).
  // --porcelain output is `XY filename`; strip the 3-char status prefix.
  // Renames appear as `R  old -> new`; --no-renames keeps both columns simple.
  return git('status', '--porcelain', '--no-renames')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3));
}

function groupByPackage(files) {
  const byPkg = new Map();
  const skipped = [];
  for (const file of files) {
    const m = /^packages\/([^/]+)\//.exec(file);
    if (!m) {
      skipped.push(file);
      continue;
    }
    const pkg = m[1];
    if (!byPkg.has(pkg)) byPkg.set(pkg, []);
    byPkg.get(pkg).push(file);
  }
  return { byPkg, skipped };
}

function hasScript(pkgDir, name) {
  const pj = path.join(pkgDir, 'package.json');
  if (!existsSync(pj)) return false;
  try {
    const json = JSON.parse(readFileSync(pj, 'utf8'));
    return Boolean(json.scripts && json.scripts[name]);
  } catch {
    return false;
  }
}

function resolveBin(pkgDir, name) {
  const pkgBin = path.join(pkgDir, 'node_modules', '.bin', name);
  if (existsSync(pkgBin)) return pkgBin;
  const rootBin = path.join(ROOT, 'node_modules', '.bin', name);
  if (existsSync(rootBin)) return rootBin;
  return null;
}

function run(label, command, args, opts) {
  console.log(`\n→ ${label}: ${command} ${args.join(' ')}  (cwd: ${opts.cwd})`);
  const r = spawnSync(command, args, { stdio: 'inherit', ...opts });
  return r.status === 0;
}

function verifyPackage(pkg, files) {
  const pkgDir = path.join(ROOT, 'packages', pkg);
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    console.warn(`Skipping ${pkg}: no packages/${pkg}/package.json`);
    return true;
  }

  let ok = true;

  // Lint changed lintable files.
  const lintable = files
    .filter((f) => LINT_EXTS.has(path.extname(f)))
    .filter((f) => existsSync(path.join(ROOT, f))) // skip deleted files
    .map((f) => path.relative(pkgDir, path.join(ROOT, f)));

  if (lintable.length > 0 && hasScript(pkgDir, 'lint')) {
    // Prefer the package-local eslint binary — root and packages can carry
    // different major versions (e.g. ESLint 7 at root vs 8 in cli), and
    // @typescript-eslint plugins are pinned to one major.
    const eslintBin = resolveBin(pkgDir, 'eslint');
    if (!eslintBin) {
      console.warn(`Skipping lint for ${pkg}: eslint not found in node_modules/.bin`);
    } else {
      ok =
        run(
          `${pkg}: eslint (${lintable.length} file${lintable.length === 1 ? '' : 's'})`,
          eslintBin,
          // --quiet hides warnings; CI rules that only warn are not blockers.
          ['--quiet', ...lintable],
          { cwd: pkgDir }
        ) && ok;
    }
  }

  // Typecheck the whole package.
  if (hasScript(pkgDir, 'typecheck') && existsSync(path.join(pkgDir, 'tsconfig.json'))) {
    const tscBin = resolveBin(pkgDir, 'tsc');
    if (!tscBin) {
      console.warn(`Skipping typecheck for ${pkg}: tsc not found in node_modules/.bin`);
    } else {
      ok = run(`${pkg}: tsc --noEmit`, tscBin, ['--noEmit'], { cwd: pkgDir }) && ok;
    }
  }

  return ok;
}

const files = modifiedFiles();
if (files.length === 0) {
  console.log('No modified files. Nothing to verify.');
  process.exit(0);
}

const { byPkg, skipped } = groupByPackage(files);
console.log(`Verifying ${byPkg.size} package(s) with modified files:`);
for (const [pkg, pkgFiles] of byPkg) {
  console.log(`  packages/${pkg} (${pkgFiles.length} file${pkgFiles.length === 1 ? '' : 's'})`);
}
if (skipped.length > 0) {
  console.log(`  skipped ${skipped.length} non-package file(s)`);
}

let allOk = true;
for (const [pkg, pkgFiles] of byPkg) {
  allOk = verifyPackage(pkg, pkgFiles) && allOk;
}

if (!allOk) {
  console.error('\nverify: FAILED');
  process.exit(1);
}
console.log('\nverify: OK');
