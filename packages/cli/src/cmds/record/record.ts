import { exists, verbose } from '../../utils';
import chalk from 'chalk';
import portPid from 'port-pid';
import ps from 'ps-node';
import UI from '../userInteraction';
import runCommand from '../runCommand';
import { request as httpsRequest } from 'https';
import { request as httpRequest, RequestOptions } from 'http';

class RemoteRecordingStatus {
  constructor(public enabled: boolean) {}
}

export const command = 'record';
export const describe =
  'Create an AppMap via interactive recording, aka remote recording.';

export const builder = (args) => {
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    UI.progress(`To create a recording, the first thing you need to do is run your app using
the instructions in the AppMap documentation. Choose the most suitable link here,
then configure and launch your app process. Press enter wen you're ready to continue.`);
    UI.progress(`
Rails:    https://appland.com/docs/reference/appmap-ruby.html#remote-recording
Django:   https://appland.com/docs/reference/appmap-python.html#django
Flask:    https://appland.com/docs/reference/appmap-python.html#flask
Java - IntelliJ: (TBD)
Java - Raw JDK:  (TBD)
    `);

    await UI.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'Ready?',
      default: 'y',
    });

    /**
     * Populate protocol, hostname and port.
     */
    const promptForHostAndPort = async (options: RequestOptions) => {
      const { useLocalhost } = await UI.prompt({
        type: 'confirm',
        name: 'useLocalhost',
        message: 'Is your app running on localhost (your machine)?',
        default: 'y',
      });
      if (!useLocalhost) {
        options.hostname = await UI.prompt({
          type: 'input',
          name: 'hostname',
          message: 'Enter the hostname that your server is running on:',
        })['hostname'];
      } else {
        options.hostname = 'localhost';
      }

      options.port = null;
      while (!options.port) {
        const { portNumber: answer } = await UI.prompt({
          type: 'number',
          name: 'portNumber',
          message: 'Enter the port number on which your server is listening:',
        });
        if (answer) {
          options.port = answer;
        }
      }
    };

    let requestOptions: RequestOptions = {};

    await promptForHostAndPort(requestOptions);

    if (requestOptions.hostname === 'localhost') {
      UI.progress(`OK, since your app is running on localhost, I'm going to try and get more info about it
using a reverse-lookup by port number.`);
      UI.status = `Looking up the application process info`;

      const printPid = async (pid: number) => {
        return new Promise((resolve, reject) => {
          ps.lookup({ pid }, function (err: any, resultList: any[]) {
            if (err) {
              reject(err);
            }

            const process = resultList[0];
            if (process) {
              UI.success(process.arguments.join(' '));
              resolve(null);
            } else {
              UI.error(`Process ${pid} not found`);
              reject();
            }
          });
        });
      };

      UI.progress('');

      await portPid(requestOptions.port).then(async (pids: any) =>
        Promise.all(pids.tcp.map(printPid))
      );

      UI.progress('');
      const cont = await UI.prompt({
        type: 'confirm',
        name: 'continue',
        message: 'Does this look right?',
        default: 'y',
      });
      if (!cont) {
        UI.progress(`Do you want to change the hostname and port number? Alternatively, you can adjust your
        app process parameters, restart it, and then I will retry.`);
        UI.progress(
          `Press enter when you're ready for me to retry the connection.`
        );
      }
    }

    const { baseURL } = await UI.prompt({
      type: 'input',
      name: 'baseURL',
      message: `Enter the base URL of your application. Leave this blank unless you've mounted your app somewhere other than the root context:`,
      default: '',
    });
    const { useSSL } = await UI.prompt({
      type: 'confirm',
      name: 'useSSL',
      message: 'Does your application require SSL?',
      default: false,
    });
    const protocol = useSSL ? 'https' : 'http';

    UI.progress(
      `OK. Now I will try and connect to the AppMap recording agent.`
    );
    UI.progress(`Here's the URL I will use:\n`);
    UI.progress(
      `${protocol}://${requestOptions.hostname}:${requestOptions.port}/${baseURL}_appmap/record`
    );
    UI.progress('');

    const { proceed } = await UI.prompt({
      type: 'confirm',
      name: 'proceed',
      message: 'Are you ready to proceed?',
      default: true,
    });
    UI.status = `Performing a test connection to the app`;

    const remoteRecordingStatus = async (): Promise<RemoteRecordingStatus> => {
      const options = Object.assign({}, requestOptions, {
        path: `/${baseURL}_appmap/record`,
        method: 'GET',
      });

      const requestFn = useSSL ? httpsRequest : httpRequest;
      return new Promise((resolve, reject) => {
        const req = requestFn(options, (res) => {
          if (res.statusCode !== 200) {
            return reject(`HTTP status code ${res.statusCode}`);
          }

          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(JSON.parse(data));
          });
        });

        req.on('error', (e) => {
          reject(e.message);
        });

        // Write data to request body
        req.end();
      });
    };

    let status: RemoteRecordingStatus | null = null;
    while (!status) {
      try {
        status = await remoteRecordingStatus();
        UI.success(`Great! I am able to connect to the AppMap agent.`);
      } catch (e) {
        UI.error(
          `Uh-oh. I can't connect to the AppMap agent there. The error I got is:\n\n${e}\n`
        );

        const { reconfigure } = await UI.prompt({
          type: 'confirm',
          name: 'reconfigure',
          message:
            'Do you want to change any of the server connection parameters?',
        });

        console.log(reconfigure);
      }
    }
  };

  return runCommand(commandFn);
};
