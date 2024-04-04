import yargs from 'yargs';
import express from 'express';

import { verbose } from '../../utils';
import appmapProvider from './appmap-provider';
import bm25Provider from './bm25-provider';
import bodyParser from 'body-parser';
import { inspect } from 'util';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import indexSource from '../../fulltext/SourceIndexSQLite';
import { existsSync, rmSync } from 'fs';

export type ContextType = 'sequenceDiagram' | 'codeSnippet' | 'dataRequest';

export type ContextValue = {
  id?: string;
  type: ContextType;
  content: string;
  score?: number;
};

export type ContextResult = ContextValue[];

type ProviderFunction = (keywords: string[], charLimit: number) => Promise<ContextResult>;

export const command = 'context-provider';
export const describe = 'Run context provider service';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('port', {
    describe:
      'port to listen on. Use port 0 to let the OS choose a port. The port number will be printed to stdout on startup.',
    type: 'number',
    alias: 'p',
  });
  args.option('text-index-file', {
    describe: 'path to the text index file',
    type: 'string',
    alias: 't',
  });
  args.option('clobber', {
    describe: 'overwrite existing files if they already exist',
    type: 'boolean',
    alias: 'c',
    default: false,
  });
  args.option('listen', {
    describe: 'run a web server to listen for context requests',
    type: 'boolean',
    alias: 'l',
    default: true,
  });

  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  const { port: portStr, textIndexFile, listen, clobber } = argv;

  if (textIndexFile) {
    if (existsSync(textIndexFile)) {
      if (clobber) {
        console.warn(
          `File ${textIndexFile} already exists and --clobber option is set, so it will be rebuilt.`
        );

        rmSync(textIndexFile, { recursive: true, force: true });
      }
    }

    if (!existsSync(textIndexFile)) {
      console.log(`Building text index in file: ${textIndexFile}`);
      await indexSource(textIndexFile);
    }
  }

  if (!listen) {
    return;
  }

  const port = portStr ? parseInt(portStr, 10) : 30102;

  const app = express();
  app.use(bodyParser.json());

  const contextProviders: Record<string, ProviderFunction> = {
    appmap: appmapProvider,
    bm25: bm25Provider.bind(null, textIndexFile),
  };

  // Define the route for /context-provider?provider
  app.post('/context/:provider', async (req, res) => {
    const { provider } = req.params;

    const { charLimit } = req.body;
    const { keywords } = req.body;

    if (!provider || typeof provider !== 'string' || !contextProviders[provider]) {
      return res.status(404).send('Invalid or missing :provider');
    }
    if (!charLimit || typeof charLimit !== 'number' || charLimit < 0) {
      return res.status(400).send(`Expecting 'charLimit', a positive integer`);
    }
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).send(`Expecting 'keywords'`);
    }

    const providerFunction = contextProviders[provider];

    let result: any;
    try {
      console.log(
        `Executing provider ${provider} with keywords '${keywords.join(
          ' '
        )}' and charLimit ${charLimit}`
      );
      result = await providerFunction(keywords, charLimit);
    } catch (error) {
      console.error('Error executing provider:', error);
      res.status(500).send('Internal server error');
      return;
    }

    res.json(result);
  });

  // Start listening on the specified port
  app.listen(port, () => {
    console.log(`Context provider service is running on port ${port}`);
  });
};
