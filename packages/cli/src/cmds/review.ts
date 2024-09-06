import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { querySymbolLocations } from '../fulltext/querySymbols';
import { readFileSync } from 'fs';

const exec = promisify(execCb);

type ChangeSummary = {
  diff: string;
  changes: FileChangeSummary[];
};

type FileChangeSummary = {
  path: string;
  changedSymbols: string[];
  diffChunks: string[];
  content: string;
};

type FileChange = {
  path: string;
  changes: Change[];
};

type Change = {
  start: number;
  end: number;
};

type SymbolLocation = {
  name: string;
  line: number;
};

type FileDiff = {
  path: string;
  chunks: string[];
};

function parseChanges(diff: string): FileChange[] {
  const files = diff.split(/^diff --git/gm);
  const fileChanges: FileChange[] = [];

  for (const file of files) {
    const path = file.match(/\+\+\+ b\/(.*)/)?.[1];
    if (!path) continue;

    const locations = [...file.matchAll(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/gm)];
    if (!locations.length) continue;

    const changes: Change[] = [];
    for (const location of locations) {
      const start = parseInt(location[3], 10);
      const end = start + parseInt(location[4], 10);

      changes.push({ start, end });
    }

    fileChanges.push({ path, changes });
  }

  return fileChanges;
}

function parseFileDiffs(diff: string): FileDiff[] {
  const files = diff.split(/(?=^diff --git)/gm);
  const fileDiffs: FileDiff[] = [];
  for (const file of files) {
    const path = file.match(/\+\+\+ b\/(.*)/)?.[1];
    if (!path) continue;

    const chunks = file.split(/(?=^@@ -\d+,\d+ \+\d+,\d+ @@)/gm).slice(1);
    fileDiffs.push({ path, chunks });
  }
  return fileDiffs;
}

// If a change range is on or between two symbols, consider it as a change to the symbol.
function getChangedSymbols(fileChanges: FileChange, fileSymbols: SymbolLocation[]): string[] {
  const changedSymbols = new Set<string>();

  for (const { start, end } of fileChanges.changes) {
    for (let i = 0; i < fileSymbols.length; i++) {
      const currentSymbol = fileSymbols[i];
      const nextSymbol = fileSymbols[i + 1];
      const range = { start: currentSymbol.line, end: nextSymbol?.line ?? Infinity };
      const startsInRange = start >= range.start && start <= range.end;
      const endsInRange = end >= range.start && end <= range.end;
      const spansRange = start <= range.start && end >= range.end;
      if (startsInRange || endsInRange || spansRange) {
        changedSymbols.add(currentSymbol.name);
        continue;
      }
    }
  }

  return Array.from(changedSymbols);
}

export async function getChangeSummary(base: string, head = 'HEAD'): Promise<ChangeSummary> {
  const diffLog = (await exec(`git log -p --full-diff ${base}..${head}`)).stdout;
  const diff = (await exec(`git diff ${base}..${head}`)).stdout;
  const fileChanges = parseChanges(diff);
  const diffChunks = parseFileDiffs(diff).reduce((acc, { path, chunks }) => {
    acc[path] = chunks;
    return acc;
  }, {} as Record<string, string[]>);
  const fileSymbols = fileChanges.reduce((acc, { path }) => {
    acc[path] = Object.entries(querySymbolLocations(path)).map(([name, line]) => ({ name, line }));
    return acc;
  }, {} as Record<string, SymbolLocation[]>);
  const fileContents = fileChanges.reduce((acc, { path }) => {
    acc[path] = readFileSync(path, 'utf-8');
    return acc;
  }, {} as Record<string, string>);
  const changedSymbols = fileChanges.reduce((acc, fc) => {
    acc[fc.path] = getChangedSymbols(fc, fileSymbols[fc.path]);
    return acc;
  }, {} as Record<string, string[]>);
  const changeSummary = fileChanges.map(({ path }) => ({
    path,
    diffChunks: diffChunks[path],
    changedSymbols: changedSymbols[path],
    content: fileContents[path],
  }));

  return {
    diff: diffLog,
    changes: changeSummary.filter(
      ({ content, path }) => content.length < 56_000 && !path.includes('.lock')
    ),
  };
}
