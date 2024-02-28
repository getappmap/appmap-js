import yargs from 'yargs';
import chalk from 'chalk';
import assert from 'assert';
import { readFileSync } from 'fs';
import { error, log, warn } from 'console';
import {
  Context,
  explain,
  Explain,
  help,
  Help,
  InteractionHistory,
  ProjectInfo,
} from '@appland/navie';

import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import collectContext from '../../rpc/explain/collectContext';
import { appmapStatsHandler } from '../../rpc/appmap/stats';

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
    alias: 't',
    type: 'string',
    choices: ['explain', 'help'],
    requiresArg: true,
    demandOption: true,
  });

  args.option('appmap-file', {
    describe: 'AppMap file demonstrating the existing application behavior',
    type: 'array',
  });

  args.option('code-file', {
    describe: 'Existing code file to use as an example',
    type: 'array',
  });

  args.option('model', {
    describe: 'AI model to use',
    type: 'string',
  });

  args.option('token-limit', {
    describe: 'Maximum number of tokens to return',
    type: 'number',
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

function collectProjectInfo(appmapConfig: any): () => Promise<ProjectInfo.ProjectInfoResponse> {
  return async () => {
    const appmapDir = appmapConfig.appmap_dir || 'tmp/appmap';
    const appmapStats: any = await appmapStatsHandler(appmapDir);
    delete appmapStats.classes; // This is verbose and I don't see the utility of it
    return {
      'appmap.yml': appmapConfig,
      appmapStats,
    };
  };
}

function buildExplainRequest(
  question: string,
  appmapConfig: any,
  appmapDir: string,
  appmaps: string[] | undefined,
  codeFiles?: string[],
  model?: string,
  tokenLimit?: number
): () => AsyncIterable<string> {
  const clientRequest: Explain.ClientRequest = {
    question,
  };
  if (codeFiles) {
    if (codeFiles.length > 1) {
      throw new Error('Only one code selection is supported');
    }
    clientRequest.codeSelection = readFileSync(codeFiles[0], 'utf-8');
  }

  const contextProvider = async (request: Context.ContextRequest) => {
    const charLimit = request.tokenCount * 3;
    const result = await collectContext(appmapDir, appmaps, request.vectorTerms, charLimit);
    return {
      sequenceDiagrams: result.context.sequenceDiagrams,
      codeSnippets: Array.from<string>(result.context.codeSnippets.keys()).reduce((acc, key) => {
        const snippet = result.context.codeSnippets.get(key);
        assert(snippet !== undefined);
        if (snippet) acc[key] = snippet;
        return acc;
      }, {} as Record<string, string>),
      codeObjects: [...result.context.codeObjects],
    };
  };

  const projectInfoProvider = collectProjectInfo(appmapConfig);

  const options = new Explain.ExplainOptions();
  if (model) options.modelName = model;
  if (tokenLimit) options.tokenLimit = tokenLimit;
  const chatHistory = [];
  return () => {
    const fn = explain(clientRequest, contextProvider, projectInfoProvider, options, chatHistory);
    logRequest(fn);
    return fn.execute();
  };
}

function buildHelpRequest(question: string, appmapConfig: any): () => AsyncIterable<string> {
  const clientRequest: Help.ClientRequest = {
    question,
  };

  const projectInfoProvider = collectProjectInfo(appmapConfig);

  const options = new Help.HelpOptions();
  const chatHistory = [];
  return () => {
    const fn = help(clientRequest, projectInfoProvider, options, chatHistory);
    logRequest(fn);
    return fn.execute();
  };
}

export const handler = async (argv) => {
  warn(argv);
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  const appmapConfig: any = (await loadAppMapConfig()) || {};
  const appmapDir = appmapConfig.appmap_dir || 'tmp/appmap';

  const { appmapFile: appmapFiles, codeFile: codeFiles, tool, model, tokenLimit } = argv;
  const question = argv.question || argv._.pop();

  log('\n');
  process.stdout.write(chalk.gray(`${Date.now() - START!}ms `));
  log(`Invoking tool: ${chalk.bold(tool)}`);
  log('\n');

  if (tool === 'explain') {
    const generator = buildExplainRequest(
      question,
      appmapConfig,
      appmapDir,
      appmapFiles,
      codeFiles,
      model,
      tokenLimit
    );
    for await (const token of generator()) {
      process.stdout.write(token);
    }
  } else if (tool === 'help') {
    const generator = buildHelpRequest(question, appmapConfig);
    for await (const token of generator()) {
      process.stdout.write(token);
    }
  } else {
    error(`Unknown tool: ${tool}`);
  }
};
