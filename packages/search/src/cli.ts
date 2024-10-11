import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import sqlite3 from 'better-sqlite3';
import makeDebug from 'debug';

import { fileTokens } from './tokenize';
import FileIndex from './file-index';
import buildIndex from './build-index';
import listProjectFiles from './project-files';
import { isBinaryFile, isDataFile, isLargeFile } from './file-type';

const debug = makeDebug('appmap:search:cli');

yargs(hideBin(process.argv))
  .command(
    '* <query>',
    'Index directories and perform a search',
    (yargs) => {
      return yargs
        .option('directories', {
          alias: 'd',
          type: 'array',
          description: 'List of directories to index',
          default: ['.'],
        })
        .option('file-filter', {
          type: 'string',
          description: 'Regex pattern to filter files',
        })
        .positional('query', {
          describe: 'Search query',
          type: 'string',
        })
        .strict();
    },
    async (argv) => {
      const { directories, query } = argv;

      const db = new sqlite3(':memory:');
      const fileIndex = new FileIndex(db);

      let filterRE: RegExp | undefined;
      if (argv.fileFilter) filterRE = new RegExp(argv.fileFilter);

      const fileFilter = async (path: string) => {
        debug('Filtering: %s', path);
        if (isBinaryFile(path)) {
          debug('Skipping binary file: %s', path);
          return false;
        }

        const isData = isDataFile(path);
        if (isData && (await isLargeFile(path))) {
          debug('Skipping large data file: %s', path);
          return false;
        }

        if (!filterRE) return true;

        return !filterRE.test(path);
      };

      const search = async () => {
        await buildIndex(
          fileIndex,
          directories as string[],
          listProjectFiles,
          fileFilter,
          fileTokens
        );
        const results = fileIndex.search(query as string);
        for (const result of results) {
          const { filePath, score } = result;
          const roundScore = Math.round(score * 100) / 100;
          console.log([filePath, roundScore].join('    '));
        }
      };

      try {
        await search();
      } finally {
        fileIndex.close();
      }
    }
  )
  .help().argv;
