import { mkdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { MCP_RETURN_VALUE_BUDGET } from '../../lib/truncateStructValue';
import type { StructBudget } from '../../lib/truncateStructValue';
import { writeFileAtomic } from '../../utils';
import { trimAppMap } from './trim';
import type { AppMap } from './trim';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CLI_VERSION: string = require('../../../package.json').version;

export default async function handler(argv: any): Promise<void> {
  handleWorkingDirectory(argv.directory);

  // --max-length is a hard cap on every captured value string: it sets the
  // flat cap and, so the flag means what it says, lowers the per-field and id
  // caps to match (never above their defaults). maxFields 12 (vs the MCP
  // renderer's 16) — trim leans slightly more aggressive since a baseline
  // wants leanness over readability.
  const maxLength = argv.maxLength as number;
  const budget: StructBudget = {
    perValueCap: Math.min(MCP_RETURN_VALUE_BUDGET.perValueCap, maxLength),
    idCap: Math.min(MCP_RETURN_VALUE_BUDGET.idCap, maxLength),
    maxFields: 12,
    flatCap: maxLength,
  };
  const files = argv.files as string[];
  if (argv.outputDir) mkdirSync(argv.outputDir, { recursive: true });

  let failed = 0;
  for (const file of files) {
    let before: string;
    let trimmed: string;
    try {
      before = readFileSync(file, 'utf8');
      const appmap = JSON.parse(before) as AppMap;

      // metadata.trimmed is the file's provenance: skip when this exact CLI
      // version already trimmed it to this cap. Truncation is one-way, so a
      // re-run records the smaller of the two caps and can never grow values.
      const prior = appmap.metadata?.trimmed;
      if (prior && prior.version === CLI_VERSION && prior.max_length === maxLength) {
        console.warn(`trim ${file}: already trimmed (v${CLI_VERSION}), skipping`);
        continue;
      }
      if (prior && maxLength > prior.max_length)
        console.warn(
          `trim ${file}: already trimmed to ${prior.max_length}; a larger cap cannot ` +
            `restore truncated values (re-record to grow them)`
        );

      trimAppMap(appmap, budget);
      appmap.metadata = {
        ...(appmap.metadata ?? {}),
        trimmed: {
          version: CLI_VERSION,
          max_length: prior ? Math.min(prior.max_length, maxLength) : maxLength,
        },
      };
      trimmed = JSON.stringify(appmap);
    } catch (error) {
      // Skip an unreadable/malformed file rather than aborting: one bad file
      // in a batch must not stop the rest or leave earlier files half-done.
      failed += 1;
      console.warn(`trim ${file}: skipped (${(error as Error).message})`);
      continue;
    }
    const outputPath = argv.outputDir ? join(argv.outputDir, basename(file)) : file;
    // Write atomically (temp file in the same dir, then rename) so an
    // interrupted or failed write never leaves a partial AppMap in place.
    await writeFileAtomic(dirname(outputPath), basename(outputPath), 'trim.tmp', trimmed);
    const pct = Math.round((100 * trimmed.length) / before.length);
    console.warn(`trim ${file}: ${before.length} -> ${trimmed.length} bytes (${pct}%)`);
  }
  if (files.length > 0 && failed === files.length) {
    throw new Error(`trim: all ${failed} input file(s) failed to process`);
  }
}
