import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import { runCliFromSource } from './support/runCliFromSource';

const appmapFile = resolve(__dirname, 'fixtures', 'ruby', 'revoke_api_key.appmap.json');

describe('CLI argument validation', () => {
  let outputDir: string;

  beforeEach(() => (outputDir = mkdtempSync(join(tmpdir(), 'cli-validation-'))));
  afterEach(() => rmSync(outputDir, { recursive: true, force: true }));

  it('does not run the command when given an unknown option', () => {
    const result = runCliFromSource(
      ['sequence-diagram', '-f', 'json', '--output-dir', outputDir, '--bogus=1', appmapFile],
      { timeout: 60_000 }
    );

    expect(result.status).toBe(1);
    // The message itself is localized.
    expect(result.stdout).toContain('bogus');
    expect(existsSync(join(outputDir, 'revoke_api_key.sequence.json'))).toBe(false);
  });
});
