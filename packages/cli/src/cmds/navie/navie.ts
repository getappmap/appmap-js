import yargs from 'yargs';
import chalk from 'chalk';
import assert from 'assert';
import { readFileSync } from 'fs';
import { error, log, warn } from 'console';
import {
  Classify,
  classify,
  ContextRequest,
  explain,
  Explain,
  generateTest,
  GenerateTest,
  InteractionHistory,
} from '@appland/navie';

import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { handler as search } from '../../rpc/search/search';
import context from '../../rpc/explain/context';
import loadAppMapConfig from '../../lib/loadAppMapConfig';

export const command = 'navie [question]';
export const describe = 'Generate a test case using Navie AI';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('tool', {
    describe: 'Navie tool to use (default: guessed automatically)',
    type: 'string',
    choices: ['classify', 'explain', 'generate-test'],
    requiresArg: false,
  });

  args.option('appmap-file', {
    describe: 'AppMap file demonstrating the existing application behavior',
    type: 'array',
  });

  args.option('code-file', {
    describe: 'Existing code file to use as an example',
    type: 'array',
  });

  args.option('model-name', {
    describe: 'Navie model name to use',
    type: 'string',
  });

  args.positional('question', {
    describe: 'question to answer',
    type: 'string',
  });

  return args.strict();
};

let START: number | undefined;

function logRequest(events: InteractionHistory.InteractionHistoryEvents) {
  events.on('event', (event) => {
    if (!START) START = Date.now();

    const elapsed = Date.now() - START;
    process.stderr.write(chalk.gray(`${elapsed}ms `));
    process.stderr.write(chalk.gray(event.message));
    process.stderr.write(chalk.gray('\n'));
  });
}

function buildClassifyRequest(question: string): () => Promise<string> {
  const clientRequest: Classify.ClientRequest = { question };
  return async () => {
    const fn = classify(clientRequest, new Classify.ClassifyOptions());
    logRequest(fn);
    return await fn.execute();
  };
}

function buildExplainRequest(
  question: string,
  appmapDir: string | undefined,
  codeFiles?: string[],
  tokenLimit?: number
): () => AsyncIterable<string> {
  const clientRequest: Explain.ClientRequest = {
    question,
    requestContext: async (request: ContextRequest) => {
      const searchResponse = await search(request.vectorTerms.join(' '), {
        appmapDir: appmapDir || 'tmp/appmap',
        threshold: 0.5, // Include event matches up to mean score + 0.5 * stddev
      });
      const result = await context(searchResponse);
      return {
        sequenceDiagrams: result.sequenceDiagrams,
        codeSnippets: Array.from<string>(result.codeSnippets.keys()).reduce((acc, key) => {
          const snippet = result.codeSnippets.get(key);
          assert(snippet !== undefined);
          if (snippet) acc[key] = snippet;
          return acc;
        }, {} as Record<string, string>),
        codeObjects: [...result.codeObjects],
      };
    },
  };
  if (codeFiles) {
    if (codeFiles.length > 1) {
      throw new Error('Only one code selection is supported');
    }
    clientRequest.codeSelection = readFileSync(codeFiles[0], 'utf-8');
  }

  const options = new Explain.ExplainOptions();
  if (tokenLimit) options.tokenLimit = tokenLimit;
  const chatHistory = [];
  return () => {
    const fn = explain(clientRequest, options, chatHistory);
    logRequest(fn);
    return fn.execute();
  };
}

function buildGenerateTestRequest(
  question: string,
  appmapDir: string | undefined,
  appmaps: string[],
  codeFiles: string[],
  tokenLimit?: number
): () => AsyncIterable<string> {
  const testExamples = codeFiles.map((codeFile) => readFileSync(codeFile, 'utf-8'));

  const clientRequest: GenerateTest.GenerateTestRequest = {
    appmaps,
    appmapDir,
    question,
    testExamples,
    requestContext: async (request: ContextRequest) => {
      const searchResponse = await search(request.vectorTerms.join(' '), {
        appmaps,
        appmapDir,
      });
      const result = await context(searchResponse);
      return {
        sequenceDiagrams: result.sequenceDiagrams,
        codeSnippets: Array.from<string>(result.codeSnippets.keys()).reduce((acc, key) => {
          const snippet = result.codeSnippets.get(key);
          assert(snippet !== undefined);
          if (snippet) acc[key] = snippet;
          return acc;
        }, {} as Record<string, string>),
        codeObjects: [...result.codeObjects],
      };
    },
  };
  const options = new GenerateTest.GenerateTestOptions();
  if (tokenLimit) options.tokenLimit = tokenLimit;
  const chatHistory = [];
  return () => {
    const fn = generateTest(clientRequest, options, chatHistory);
    logRequest(fn);
    return fn.execute();
  };
}

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = (await loadAppMapConfig())?.appmap_dir;

  const { appmapFile: appmapFiles, codeFile: codeFiles, tool, tokenLimit } = argv;
  const question = argv._.pop();

  let chosenTool = tool;
  if (!chosenTool) {
    const classifier = buildClassifyRequest(question);
    chosenTool = await classifier();
  }

  log('\n');
  process.stdout.write(chalk.gray(`${Date.now() - START!}ms `));
  log(`Chosen tool: ${chalk.bold(chosenTool)}`);
  log('\n');

  if (chosenTool === 'classify') {
    const classifier = buildClassifyRequest(question);
    log(await classifier());
  } else if (chosenTool === 'explain') {
    const generator = buildExplainRequest(question, appmapDir, codeFiles, tokenLimit);
    for await (const token of generator()) {
      process.stdout.write(token);
    }
  } else if (chosenTool === 'generate-test') {
    const generator = buildGenerateTestRequest(
      question,
      appmapDir,
      appmapFiles,
      codeFiles,
      tokenLimit
    );
    for await (const token of generator()) {
      process.stdout.write(token);
    }
  } else {
    error(`Unknown tool: ${chosenTool}`);
  }
};
