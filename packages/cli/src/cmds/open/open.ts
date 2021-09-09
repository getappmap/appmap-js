import { exists, verbose } from '../../utils';
import chalk from 'chalk';
import UI from '../userInteraction';
import runCommand from '../runCommand';
import open from 'open';
import { basename, dirname } from 'path';
import { createServer, request } from 'http';
import { createReadStream } from 'fs';
import { parse } from 'url';
import { AddressInfo } from 'net';

export const command = 'open [appmap-file]';
export const describe = 'Open an AppMap in the system default browser';

export const builder = (args) => {
  args.positional('appmap-file', {
    describe: 'path to the AppMap to open.',
    type: 'string',
    default: undefined,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { appmapFile } = argv;

    if (!appmapFile) {
      UI.error(`AppMap file argument is required.`);
      process.exit(1);
    }
    if (!(await exists(appmapFile))) {
      UI.error(`AppMap file ${chalk.red(appmapFile)} does not exist.`);
      process.exit(1);
    }

    UI.progress(`Opening ${appmapFile}`);

    return new Promise((resolve) => {
      const server = createServer((req, res) => {
        try {
          var requestUrl = parse(req.url!);
          const pathname = requestUrl.pathname;
          if (pathname === '/appmap.html') {
            res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });

            // TODO: Create and serve the HTML page with the AppMap

            const fileStream = createReadStream(appmapFile);
            fileStream.pipe(res);
            fileStream.on('open', function () {
              res.writeHead(200);
            });
            fileStream.on('error', function (e) {
              res.writeHead(404);
              res.end();
            });
          } else {
            console.log(`Not found: ${pathname}`);
            res.writeHead(404);
            res.end();
          }
        } catch (e) {
          console.log(e.stack);
          res.writeHead(500);
          res.end(); // end the response so browsers don't hang
        }
      }).listen(0, '127.0.0.1', () => {
        const port = (server.address() as AddressInfo).port;
        resolve(open(`http://localhost:${port}/appmap.html`));
      });
    });
  };

  return runCommand(commandFn);
};
