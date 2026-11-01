// Tests for scripts/sync-docs.mjs. Run with `yarn test:scripts` (node --test).

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { listFiles, syncDocs } from './sync-docs.mjs';

let workspace;
let source;
let target;

const write = (root, relative, content) => {
  const file = path.join(root, ...relative.split('/'));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const read = (root, relative) => readFileSync(path.join(root, ...relative.split('/')), 'utf8');
const exists = (root, relative) => existsSync(path.join(root, ...relative.split('/')));

beforeEach(() => {
  workspace = mkdtempSync(path.join(tmpdir(), 'sync-docs-'));
  source = path.join(workspace, '_docs');
  target = path.join(workspace, 'docs');
  mkdirSync(source, { recursive: true });
  mkdirSync(target, { recursive: true });
});

afterEach(() => rmSync(workspace, { recursive: true, force: true }));

describe('syncDocs', () => {
  it('copies new files, creating directories as needed', () => {
    write(source, 'index.md', 'home');
    write(source, 'reference/guides/large.md', 'guide');

    const report = syncDocs({ source, target });

    assert.deepEqual(report.added, ['index.md', 'reference/guides/large.md']);
    assert.deepEqual(report.updated, []);
    assert.deepEqual(report.deleted, []);
    assert.equal(read(target, 'reference/guides/large.md'), 'guide');
  });

  it('updates changed files and leaves identical ones alone', () => {
    write(source, 'changed.md', 'new');
    write(source, 'same.md', 'same');
    write(target, 'changed.md', 'old');
    write(target, 'same.md', 'same');

    const report = syncDocs({ source, target });

    assert.deepEqual(report.updated, ['changed.md']);
    assert.deepEqual(report.unchanged, ['same.md']);
    assert.equal(read(target, 'changed.md'), 'new');
  });

  it('deletes files the website has retired, and prunes the directories they leave behind', () => {
    write(source, 'using-navie-ai/navie-workflow.md', 'current');
    write(target, 'using-navie-ai/navie-workflow.md', 'current');
    write(target, 'navie/using-navie.md', 'superseded');
    write(target, 'navie/index.md', 'superseded');

    const report = syncDocs({ source, target });

    assert.deepEqual(report.deleted, ['navie/index.md', 'navie/using-navie.md']);
    assert.ok(!exists(target, 'navie'), 'emptied directory should be pruned');
    assert.ok(exists(target, 'using-navie-ai/navie-workflow.md'));
  });

  it('keeps directories that still hold files', () => {
    write(source, 'reference/kept.md', 'kept');
    write(target, 'reference/kept.md', 'kept');
    write(target, 'reference/gone.md', 'gone');

    syncDocs({ source, target });

    assert.deepEqual(listFiles(target), ['reference/kept.md']);
  });

  it('mirrors only the configured extensions, dropping other assets from the target', () => {
    write(source, 'community.md', 'community');
    write(source, 'CLA Instructions.pdf', '%PDF');
    write(target, 'unused_for_now_index.html', '<html>');

    const report = syncDocs({ source, target });

    assert.deepEqual(report.added, ['community.md']);
    assert.deepEqual(report.deleted, ['unused_for_now_index.html']);
    assert.ok(!exists(target, 'CLA Instructions.pdf'), 'non-markdown should not be copied');
  });

  it('honors the exclude list', () => {
    write(source, 'reference/appmap-agent-js.md', 'retired agent');
    write(source, 'reference/appmap-node.md', 'current agent');

    const report = syncDocs({ source, target, exclude: ['reference/appmap-agent-js.md'] });

    assert.deepEqual(report.added, ['reference/appmap-node.md']);
    assert.ok(!exists(target, 'reference/appmap-agent-js.md'));
  });

  it('deletes an excluded file that is already present in the target', () => {
    write(source, 'reference/appmap-agent-js.md', 'retired agent');
    write(target, 'reference/appmap-agent-js.md', 'retired agent');

    const report = syncDocs({ source, target, exclude: ['reference/appmap-agent-js.md'] });

    assert.deepEqual(report.deleted, ['reference/appmap-agent-js.md']);
  });

  it('ignores hidden files in both trees', () => {
    write(source, '.DS_Store', 'junk');
    write(source, '.github/workflows/ignored.md', 'not docs');
    write(target, '.keep', 'keep me');

    const report = syncDocs({ source, target });

    assert.deepEqual(report.added, []);
    assert.deepEqual(report.deleted, []);
    assert.ok(exists(target, '.keep'), 'hidden target files are left alone');
  });

  it('writes nothing when dry running, but reports the same changes', () => {
    write(source, 'added.md', 'added');
    write(target, 'removed.md', 'removed');

    const dry = syncDocs({ source, target, dryRun: true });
    assert.deepEqual(dry.added, ['added.md']);
    assert.deepEqual(dry.deleted, ['removed.md']);
    assert.ok(!exists(target, 'added.md'));
    assert.ok(exists(target, 'removed.md'));

    const wet = syncDocs({ source, target });
    assert.deepEqual(wet.added, dry.added);
    assert.deepEqual(wet.deleted, dry.deleted);
  });

  it('is idempotent', () => {
    write(source, 'a.md', 'a');
    write(source, 'nested/b.md', 'b');
    syncDocs({ source, target });

    const report = syncDocs({ source, target });

    assert.deepEqual(report.added, []);
    assert.deepEqual(report.updated, []);
    assert.deepEqual(report.deleted, []);
    assert.deepEqual(report.unchanged, ['a.md', 'nested/b.md']);
  });

  it('throws when the source does not exist', () => {
    assert.throws(
      () => syncDocs({ source: path.join(workspace, 'nope'), target }),
      /does not exist/
    );
  });
});

describe('listFiles', () => {
  it('returns forward-slash relative paths in a stable order', () => {
    write(source, 'b.md', 'b');
    write(source, 'a/z.md', 'z');
    write(source, 'a/y.md', 'y');

    assert.deepEqual(listFiles(source), ['a/y.md', 'a/z.md', 'b.md']);
  });

  it('returns an empty list for a missing directory', () => {
    assert.deepEqual(listFiles(path.join(workspace, 'missing')), []);
  });
});
