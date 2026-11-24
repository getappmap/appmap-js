import { existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';

import { handler as buildDiagram } from '../../src/cmds/sequenceDiagram';
import { handler as diffDiagrams } from '../../src/cmds/sequenceDiagramDiff';
import { diffFileName } from '../../src/cmds/sequenceDiagramDiffHandler';

const AppMapDir = path.join('tests', 'unit', 'fixtures');
const OutputDir = path.join('tests', 'output', 'sequence-diagram-diffs');

const appmapFile = path.join(AppMapDir, 'ruby', 'revoke_api_key.appmap.json');

// Hides root actions that are not HTTP server requests, so the head diagram differs from the base.
const FILTER =
  'eyJjdXJyZW50VmlldyI6InZpZXdTZXF1ZW5jZSIsImZpbHRlcnMiOnsiaGlkZU5hbWUiOlsicGFja2FnZTphY3Rpb25wYWNrIl19fQ';

async function diagram(outputFile: string, filter?: string): Promise<string> {
  mkdirSync(path.dirname(outputFile), { recursive: true });
  await buildDiagram({ format: 'json', outputFile, filter, appmap: [appmapFile] });
  return outputFile;
}

describe('sequence-diagram-diff command', () => {
  beforeEach(() => {
    rmSync(OutputDir, { recursive: true, force: true });
    mkdirSync(OutputDir, { recursive: true });
  });

  describe('the output file name', () => {
    it('is built from the two diagrams', () => {
      expect(diffFileName('base/watch.sequence.json', 'head/handle.sequence.json')).toEqual(
        'watch-handle.diff'
      );
    });

    it('is the shared name when both sides are the same test', () => {
      expect(diffFileName('base/watch.sequence.json', 'head/watch.sequence.json')).toEqual(
        'watch.diff'
      );
    });
  });

  it('names the diff after the diagrams it came from', async () => {
    const baseDiagram = await diagram(path.join(OutputDir, 'base.sequence.json'));
    const headDiagram = await diagram(path.join(OutputDir, 'head.sequence.json'), FILTER);

    await diffDiagrams({
      format: 'json',
      outputDir: OutputDir,
      validate: true,
      baseDiagram,
      headDiagram,
    });

    expect(existsSync(path.join(OutputDir, 'base-head.diff.json'))).toBe(true);
  });

  it('keeps two diffs of the same test apart', async () => {
    // The diff was always called "diff", so the second of these overwrote the first.
    const base = await diagram(path.join(OutputDir, 'base', 'revoke_api_key.sequence.json'));
    const head = await diagram(
      path.join(OutputDir, 'head', 'revoke_api_key.sequence.json'),
      FILTER
    );
    const other = await diagram(path.join(OutputDir, 'head', 'other.sequence.json'), FILTER);

    await diffDiagrams({
      format: 'json',
      outputDir: OutputDir,
      validate: true,
      baseDiagram: base,
      headDiagram: head,
    });
    await diffDiagrams({
      format: 'json',
      outputDir: OutputDir,
      validate: true,
      baseDiagram: base,
      headDiagram: other,
    });

    expect(existsSync(path.join(OutputDir, 'revoke_api_key.diff.json'))).toBe(true);
    expect(existsSync(path.join(OutputDir, 'revoke_api_key-other.diff.json'))).toBe(true);
  });

  it('writes to --output-file when it is given', async () => {
    const baseDiagram = await diagram(path.join(OutputDir, 'base.sequence.json'));
    const headDiagram = await diagram(path.join(OutputDir, 'head.sequence.json'), FILTER);
    const outputFile = path.join(OutputDir, 'named', 'by-hand.json');

    await diffDiagrams({
      format: 'json',
      outputDir: OutputDir,
      validate: true,
      baseDiagram,
      headDiagram,
      outputFile,
    });

    expect(existsSync(outputFile)).toBe(true);
  });
});
