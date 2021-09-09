import { verbose } from '../../utils';
import UI from '../userInteraction';
import runCommand from '../runCommand';
import { request as httpsRequest } from 'https';
import { request as httpRequest, RequestOptions } from 'http';
import intro from './intro';
import ready from './ready';
import configureHostAndPort from './configureHostAndPort';
import confirmProcessCharacteristics from './confirmProcessCharacteristics';

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
    await intro();

    let requestOptions: RequestOptions = {};

    await configureHostAndPort(requestOptions);

    await confirmProcessCharacteristics(requestOptions);

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

    await ready();

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
