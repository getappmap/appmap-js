// eslint-disable-next-line import/no-extraneous-dependencies
import yakbak from 'yakbak';
import { createServer, RequestListener } from 'node:http';
import App from '../src/app';
import AppMap from '../src/appMap';
import Mapset from '../src/mapset';

process.env.APPLAND_URL = 'http://localhost:3001';
process.env.APPLAND_API_KEY =
  'a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5';

const handler = yakbak('http://localhost:3000', {
  dirname: './test/tapes',
  noRecord: false,
}) as unknown;

async function makeRequests() {
  await new App('kgilpin@gmail.com/sample_app_6th_ed').listFindingStatus();
  await new AppMap('153ec835-1edc-4485-b4b8-65fd411197e9').get();
  await new Mapset(60).listAppMaps();
}

const server = createServer(handler as RequestListener);
server.listen(3001).on('listening', async () => {
  await makeRequests();
  server.close();
});
