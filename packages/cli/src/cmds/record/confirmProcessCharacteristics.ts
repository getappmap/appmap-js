import UI from '../userInteraction';
import portPid from 'port-pid';
import ps from 'ps-node';
import { RequestOptions } from 'https';
import configureHostAndPort from './configureHostAndPort';
import ready from './ready';

export default async function confirmProcessCharacteristics(
  requestOptions: RequestOptions
) {
  if (requestOptions.hostname !== 'localhost') {
    UI.progress(
      `Since your app isn't running on localhost, I can't look up its info by port number. So let's continue with the process.`
    );
    return;
  }

  UI.progress(`OK, since your app is running on localhost, I'm going to try and get more info about it
using a reverse-lookup by port number.`);
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

  await portPid(requestOptions.port).then(async (pids: Pids) => {
    if (pids && pids.tcp.length > 0) {
      return Promise.all(pids.tcp.map(printPid));
    } else {
      UI.error(`No process found on port ${requestOptions.port}`);
    }
  });

  UI.progress('');
  const { looksGood } = await UI.prompt({
    type: 'confirm',
    name: 'looksGood',
    message: 'Does this look right?',
    default: 'y',
  });
  if (!looksGood) {
    const { reconfigureOrRetry } = await UI.prompt({
      type: 'list',
      choices: ['reconfigure', 'retry'],
      name: 'reconfigureOrRetry',
      message:
        'Do you want to change the hostname and port number? Or do you want to adjust your app process parameters, restart it, and then I will retry?',
    });

    if (reconfigureOrRetry === 'reconfigure') {
      await configureHostAndPort(requestOptions);
    } else {
      await ready();
    }

    await confirmProcessCharacteristics(requestOptions);
  }
}
