import UI from '../../userInteraction';
import portPid from 'port-pid';
import ps from 'ps-node';
import RecordContext from '../recordContext';

export default async function detectProcessCharacteristics({
  configuration,
}: RecordContext): Promise<boolean> {
  const ro = configuration.requestOptions();
  if (ro.hostname !== 'localhost') {
    return false;
  }

  UI.status = `Looking for your application process on port ${ro.port}...`;

  const printPid = async (pid: number): Promise<void> => {
    return new Promise((resolve) => {
      ps.lookup({ pid }, function (err: any, resultList: any[]) {
        if (err) {
          UI.error(`Process ${pid} not found: ${err}`);
          resolve();
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

  const start = new Date().getTime();
  const pids: Pids | undefined = await portPid(ro.port).then(
    async (pids: Pids) => {
      if (pids && pids.tcp.length > 0) {
        await Promise.all(pids.tcp.map(printPid));
        return pids;
      }
    }
  );

  if (!pids) {
    UI.error();
    UI.progress('');

    return false;
  }

  async function confirm(): Promise<boolean> {
    const { looksGood } = await UI.prompt({
      type: 'confirm',
      name: 'looksGood',
      message: `Does this look like your application server process?`,
      default: 'y',
    });
    return looksGood;
  }

  UI.progress('');
  return !!pids && (await confirm());
}
