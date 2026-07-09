import { mkdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import Yargs from 'yargs';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { BUILTIN_ALLOW, sanitizeAppMap, ValueMasker } from '../../lib/sanitizeAppMap';
import { writeFileAtomic } from '../../utils';

// Build the allowlist: built-ins plus values the user curated. Exact whole-value
// matches only — an allowed word inside a larger value keeps nothing.
function buildAllowList(allow: string[], allowFile: string | undefined): Set<string> {
  const values = new Set<string>(BUILTIN_ALLOW);
  for (const value of allow) values.add(value);
  if (allowFile) {
    for (const line of readFileSync(allowFile, 'utf8').split('\n')) {
      // Skip blanks and comment lines; a literal leading '#' value can be
      // passed with --allow instead.
      const value = line.replace(/\r$/, '');
      if (value && !value.startsWith('#')) values.add(value);
    }
  }
  return values;
}

export default {
  command: 'sanitize <files..>',

  describe:
    'Replace captured values in AppMaps with per-file equality-preserving tokens, so the files cannot carry secrets',

  builder: (args: Yargs.Argv) => {
    args.positional('files', {
      describe: 'AppMap file(s) to sanitize',
      type: 'string',
    });

    args.option('allow', {
      describe:
        'Value to keep verbatim (repeatable). Exact whole-value match; meant for small public vocabularies such as state or role names',
      type: 'array',
      default: [],
    });

    args.option('allow-file', {
      describe: 'File of values to keep verbatim, one per line (# comments and blank lines skipped)',
      type: 'string',
    });

    args.option('output-dir', {
      describe: 'Write sanitized AppMaps here (default: overwrite each file in place)',
      type: 'string',
      alias: 'o',
    });

    args.option('directory', {
      describe: 'Working directory for the command',
      type: 'string',
      alias: 'd',
    });

    return args;
  },

  handler: async (argv: any): Promise<void> => {
    handleWorkingDirectory(argv.directory);

    const allow = buildAllowList((argv.allow as unknown[]).map(String), argv.allowFile as string);
    const files = argv.files as string[];
    if (argv.outputDir) mkdirSync(argv.outputDir, { recursive: true });

    let failed = 0;
    for (const file of files) {
      let before: string;
      let sanitized: string;
      let distinct: number;
      try {
        before = readFileSync(file, 'utf8');
        // A fresh masker per file: the token namespace is per-AppMap by
        // design, so values never correlate across files.
        const masker = new ValueMasker(allow);
        sanitized = JSON.stringify(sanitizeAppMap(JSON.parse(before), masker));
        distinct = masker.distinctCount;
      } catch (error) {
        // Skip an unreadable/malformed file rather than aborting: one bad file
        // in a batch must not stop the rest or leave earlier files half-done.
        failed += 1;
        console.warn(`sanitize ${file}: skipped (${(error as Error).message})`);
        continue;
      }
      const outputPath = argv.outputDir ? join(argv.outputDir, basename(file)) : file;
      // Write atomically (temp file in the same dir, then rename) so an
      // interrupted or failed write never leaves a partial AppMap in place.
      await writeFileAtomic(dirname(outputPath), basename(outputPath), 'sanitize.tmp', sanitized);
      console.warn(
        `sanitize ${file}: ${distinct} distinct value(s) tokenized, ${before.length} -> ${sanitized.length} bytes`
      );
    }
    // The exit code is the contract: 0 means every file is now sanitized. A
    // skipped file keeps its original, possibly secret-bearing contents, so a
    // partial batch must not look like success. All files are still processed
    // before failing; callers who want best-effort can append `|| true`.
    if (failed > 0) {
      throw new Error(
        `sanitize: ${failed} of ${files.length} file(s) failed to process and remain unsanitized`
      );
    }
  },
};
