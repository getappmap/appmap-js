import { buildAppMap } from '@appland/models';
import { mkdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import Yargs from 'yargs';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { BUILTIN_ALLOW, CLI_VERSION, sanitizeAppMap, ValueMasker } from '../../lib/sanitizeAppMap';
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

    const userAllow = [...allow].filter((v) => !BUILTIN_ALLOW.has(v)).sort();

    let failed = 0;
    for (const file of files) {
      let before: string;
      let sanitized: string;
      let distinct: number;
      try {
        before = readFileSync(file, 'utf8');
        const appmap = JSON.parse(before);

        // The metadata.sanitized marker is the file's provenance: skip when
        // this exact CLI version already sanitized it with these options.
        const prior = appmap?.metadata?.sanitized;
        if (
          prior &&
          prior.version === CLI_VERSION &&
          JSON.stringify(prior.allow_values) === JSON.stringify(userAllow)
        ) {
          console.warn(`sanitize ${file}: already sanitized (v${CLI_VERSION}), skipping`);
          continue;
        }
        // Masking is one-way: allowing a value now cannot restore it if an
        // earlier run already masked it.
        if (prior) {
          const restored = userAllow.filter((v: string) => !prior.allow_values.includes(v));
          if (restored.length > 0)
            console.warn(
              `sanitize ${file}: ${restored.length} allow value(s) were not allowed on the ` +
                `first run; already-masked values cannot be restored (re-record to loosen)`
            );
        }

        // Normalize first — the same transform every AppMap viewer applies on
        // load: eventUpdates merged into their events, event ids re-indexed,
        // unreturned calls balanced, and credentials stripped from
        // metadata.git.repository. Masking then runs over the canonical form.
        const normalized = JSON.parse(
          JSON.stringify(buildAppMap().source(appmap).normalize().build())
        );

        // A fresh masker per file: the token namespace is per-AppMap by
        // design, so values never correlate across files.
        const masker = new ValueMasker(allow);
        sanitized = JSON.stringify(sanitizeAppMap(normalized, masker));
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
