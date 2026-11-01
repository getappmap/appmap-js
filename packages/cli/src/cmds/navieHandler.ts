import { warn } from 'node:console';
import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { Writable } from 'node:stream';
import { text } from 'node:stream/consumers';

import checkLicense from '../lib/checkLicense';
import { configureRpcDirectories } from '../lib/handleWorkingDirectory';
import observePerformance from '../lib/observePerformance';
import { explainHandler } from '../rpc/explain/explain';
import INavie, { INavieProvider } from '../rpc/explain/navie/inavie';
import detectCodeEditor from '../lib/detectCodeEditor';
import { verbose } from '../utils';
import { serveAndOpenNavie } from '../lib/serveAndOpen';
import RPCServer from './index/rpcServer';
import { rpcMethods } from './index/rpcHandler';
import buildNavieProvider from './navie/buildNavieProvider';
import type { HandlerArguments } from './navie';

export default async function handler(argv: HandlerArguments) {
  if (argv.navieProvider) warn(`--navie-provider option is no longer supported`);

  void checkLicense();
  observePerformance();
  verbose(argv.verbose);
  await configureRpcDirectories(argv.directory);

  const output = openOutput(argv.output);

  function attachNavie(navie: INavie) {
    return navie
      .on('error', (err) => {
        warn(err);
        process.exitCode = 1;
      })
      .on('token', (token) => output.write(token));
  }

  let codeEditor: string | undefined = argv.codeEditor;
  if (!codeEditor) {
    codeEditor = detectCodeEditor();
    if (codeEditor) warn(`Detected code editor: ${codeEditor}`);
  }

  const capturingProvider = (...args: Parameters<INavieProvider>) =>
    attachNavie(buildNavieProvider(argv)(...args));

  // WIP: Help the @apply command to resolve paths
  if (argv.directory.length === 1) process.chdir(argv.directory[0]);

  const openInTerminal = async () => {
    let codeSelection: string | undefined;
    if (argv.codeSelection) codeSelection = await readFile(argv.codeSelection, 'utf-8');

    let prompt: string | undefined;
    if (argv.prompt) prompt = await readFile(argv.prompt, 'utf-8');

    const question = await getQuestion(argv.input, argv.question);

    return await explainHandler(capturingProvider, codeEditor).handler({
      question,
      codeSelection,
      prompt,
    });
  };

  const openInBrowser = (): void => {
    const rpcServer = new RPCServer(0, rpcMethods(buildNavieProvider(argv), codeEditor));
    rpcServer.start((port) => {
      serveAndOpenNavie(port);
    });
  };

  if (argv.ui) {
    openInBrowser();
  } else {
    await openInTerminal();
  }
}

function openOutput(outputPath: string | undefined): Writable {
  switch (outputPath) {
    case '-':
    case undefined:
      // prevent other things from messing with the output
      console.log = console.debug = console.warn;

      warn('No output specified, writing to stdout');
      return process.stdout;
    default:
      warn(`Writing output to ${outputPath}`);
      return createWriteStream(outputPath);
  }
}

async function getQuestion(path?: string, literal?: string[]): Promise<string> {
  const question = [...(literal ?? [])];
  const targetPath = path ?? (question.length ? undefined : '-');

  if (targetPath === '-') {
    warn('Reading question from stdin');
    question.push(await text(process.stdin));
  } else if (targetPath) {
    warn(`Reading question from ${targetPath}`);
    question.push(await readFile(targetPath, 'utf-8'));
  }

  return question.join(' ');
}
