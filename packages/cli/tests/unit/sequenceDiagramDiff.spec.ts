import { existsSync, mkdirSync, rmSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import { handler as buildDiagram } from '../../src/cmds/sequenceDiagram';
import { handler as diffDiagrams } from '../../src/cmds/sequenceDiagramDiff';

const AppMapDir = path.join('tests', 'unit', 'fixtures', 'ruby');
const OutputDir = path.join('tests', 'output', 'sequence-diagram-diff');

const baseDiagramFile = path.join(OutputDir, 'base.sequence.json');
const headDiagramFile = path.join(OutputDir, 'head.sequence.json');

describe('sequence diagram diff command', () => {
  beforeAll(async () => {
    rmSync(OutputDir, { recursive: true, force: true });
    mkdirSync(OutputDir, { recursive: true });
    await buildDiagram({
      format: 'json',
      output: baseDiagramFile,
      appmap: [path.join(AppMapDir, 'revoke_api_key.appmap.json')],
    });
    await buildDiagram({
      format: 'json',
      output: headDiagramFile,
      appmap: [path.join(AppMapDir, 'user_page_scenario.appmap.json')],
    });
  });

  it('writes diff.json into --output-dir', async () => {
    const outputDir = path.join(OutputDir, 'diff');
    await diffDiagrams({
      format: 'json',
      validate: true,
      outputDir,
      baseDiagram: baseDiagramFile,
      headDiagram: headDiagramFile,
    });

    expect(existsSync(path.join(outputDir, 'diff.json'))).toBe(true);
  });

  it('writes the diff to the --output file', async () => {
    const outputFile = path.join(OutputDir, 'base-head.diff.json');
    await diffDiagrams({
      format: 'json',
      validate: true,
      output: outputFile,
      baseDiagram: baseDiagramFile,
      headDiagram: headDiagramFile,
    });

    const diff = JSON.parse(await readFile(outputFile, 'utf8'));
    expect(diff.rootActions.length).toBeGreaterThan(0);
  });

  it('rejects --output when comparing directories', async () => {
    await expect(
      diffDiagrams({
        format: 'json',
        validate: true,
        output: path.join(OutputDir, 'dirs.diff.json'),
        baseDiagram: OutputDir,
        headDiagram: OutputDir,
      })
    ).rejects.toThrow('--output');
  });
});
