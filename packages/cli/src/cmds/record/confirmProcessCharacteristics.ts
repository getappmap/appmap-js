import UI from '../userInteraction';
import portPid from 'port-pid';
import ps from 'ps-node';
import { RequestOptions } from 'https';
import configureHostAndPort from './configureHostAndPort';
import ready from './ready';
import { ExitCode } from './exitCode';

export default async function confirmProcessCharacteristics(
  requestOptions: RequestOptions
) {
  if (requestOptions.hostname !== 'localhost') {
    return;
  }

  UI.status = `Looking up the application process info`;

  const printPid = async (pid: number): Promise<void> => {
    return new Promise((resolve) => {
      ps.lookup({ pid }, function (err: any, resultList: any[]) {
        if (err) {
          UI.error(`Process ${pid} not found: ${err}`);
          return;
        }

        const process = resultList[0];
        if (process) {
          UI.success(process.arguments.join(' '));
          resolve();
        } else {
          UI.error(`Process ${pid} not found`);
          resolve();
        }
      });
    });
  };

  interface Pids {
    tcp: number[];
  }

  const pids = await portPid(requestOptions.port).then(async (pids: Pids) => {
    if (pids && pids.tcp.length > 0) {
      await Promise.all(pids.tcp.map(printPid));
      return pids;
    } else {
      UI.error(`No process found on port ${requestOptions.port}.`);
      UI.progress(
        `It looks like you need to start your app (make sure you have the AppMap agent enabled).`
      );
      UI.progress(
        `Or maybe your app is running, but it's on a different host and/or port.`
      );
    }
  });

  async function confirm(): Promise<boolean> {
    const { looksGood } = await UI.prompt({
      type: 'confirm',
      name: 'looksGood',
      message: `Is this your server running at localhost:${requestOptions.port}?`,
      default: 'y',
    });
    return looksGood;
  }

  UI.progress('');
  const looksGood = pids && (await confirm());
  if (!looksGood) {
    const { reconfigureOrRetry } = await UI.prompt({
      type: 'list',
      choices: ['reconfigure', 'retry', 'quit'],
      name: 'reconfigureOrRetry',
      message: 'How would you like to proceed?',
    });

    if (reconfigureOrRetry === 'reconfigure') {
      await configureHostAndPort(requestOptions);
    } else if (reconfigureOrRetry === 'quit') {
      process.exit(ExitCode.Quit);
    } else {
      // Try again
    }

    await confirmProcessCharacteristics(requestOptions);
  }
}
