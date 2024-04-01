import yargs from 'yargs';
import express from 'express';

import { verbose } from '../../utils';
import appmapProvider from './appmap-provider';
import bm25Provider from './bm25-provider';
import bodyParser from 'body-parser';
import { inspect } from 'util';
import { log } from 'console';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';

export type ContextType = string;

export type ContextValue = {
  id?: string;
  type: ContextType;
  content: string;
  score?: number;
};

export type ContextResult = ContextValue[];

type ProviderFunction = (keywords: string[], charLimit: number) => Promise<ContextResult>;

const CONTEXT_PROVIDERS: Record<string, ProviderFunction> = {
  appmap: appmapProvider,
  bm25: bm25Provider,
};

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

  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  const { port: portStr } = argv;
  const port = portStr ? parseInt(portStr, 10) : 30102;

  const app = express();
  app.use(bodyParser.json());

  // Define the route for /context-provider?provider
  app.post('/context/:provider', async (req, res) => {
    const { provider } = req.params;

    log(inspect(req.body));
    const { charLimit } = req.body;
    const { keywords } = req.body;

    if (!provider || typeof provider !== 'string' || !CONTEXT_PROVIDERS[provider]) {
      return res.status(404).send('Invalid or missing :provider');
    }
    if (!charLimit || typeof charLimit !== 'number' || charLimit < 0) {
      return res.status(400).send(`Expecting 'charLimit', a positive integer`);
    }
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).send(`Expecting 'keywords'`);
    }

    const providerFunction = CONTEXT_PROVIDERS[provider];

    let result: any;
    try {
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
