import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import sqlite3 from 'better-sqlite3';
import makeDebug from 'debug';

import { fileTokens } from './tokenize';
import FileIndex from './file-index';
import buildFileIndex from './build-file-index';
import listProjectFiles from './project-files';
import { isBinaryFile, isDataFile, isLargeFile } from './file-type';
import SnippetIndex from './snippet-index';
import buildSnippetIndex from './build-snippet-index';
import { readFileSafe } from './ioutil';
import { langchainSplitter } from './splitter';
import assert from 'assert';

const debug = makeDebug('appmap:search:cli');
const cli = yargs(hideBin(process.argv))
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

      const db = new sqlite3(':memory:');
      const fileIndex = new FileIndex(db);

      await buildFileIndex(
        fileIndex,
        directories as string[],
        listProjectFiles,
        fileFilter,
        readFileSafe,
        fileTokens
      );

      const filePathAtMostThreeEntries = (filePath: string) => {
        const parts = filePath.split('/');
        if (parts.length <= 3) return filePath;

        return `.../${parts.slice(-3).join('/')}`;
      };

      const printResult = (type: string, id: string, score: number) =>
        console.log('%s %s   %s', type, filePathAtMostThreeEntries(id), score.toPrecision(3));

      console.log('File search results');
      console.log('-------------------');
      const fileSearchResults = fileIndex.search(query as string);
      for (const result of fileSearchResults) {
        const { filePath, score } = result;
        printResult('file', filePath, score);
      }

      const splitter = langchainSplitter;

      const snippetIndex = new SnippetIndex(db);
      await buildSnippetIndex(snippetIndex, fileSearchResults, readFileSafe, splitter, fileTokens);

      console.log('');
      console.log('Snippet search results');
      console.log('----------------------');

      const isNullOrUndefined = (value: unknown) => value === null || value === undefined;

      const snippetSearchResults = snippetIndex.searchSnippets(query as string);
      for (const result of snippetSearchResults) {
        const { snippetId, score } = result;
        printResult(snippetId.type, snippetId.id, score);

        const [filePath, range] = snippetId.id.split(':');
        const [startLine, endLine] = range.split('-').map((n) => parseInt(n, 10));

        if (isNullOrUndefined(startLine) || isNullOrUndefined(endLine)) continue;

        const content = await readFileSafe(filePath);
        if (!content) continue;

        assert(startLine !== undefined);
        assert(endLine !== undefined);

        const lines = content.split('\n').slice(startLine - 1, endLine);
        console.log(lines.map((l) => `    > ${l}`).join('\n'));
      }

      db.close();
    }
  )
  .help().argv;

if (cli instanceof Promise) {
  cli.catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
