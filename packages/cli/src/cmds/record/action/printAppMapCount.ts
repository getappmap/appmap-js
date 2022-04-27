import { config } from 'yargs';
import { listAppMapFiles, verbose } from '../../../utils';
import UI from '../../userInteraction';
import { readConfig } from '../configuration';

export default async function printAppMapCount() {
  let fileCount = 0;

  const configuredAppMapDir = (await readConfig())?.appmap_dir;
  const appMapDir = configuredAppMapDir || '.';

  // This function is too verbose to be useful in this context.
  const v = verbose();
  verbose(false);
  await listAppMapFiles(appMapDir, (_fileName: string) => (fileCount += 1));
  verbose(v);

  UI.success(
    `There are now ${fileCount} AppMap files in directory '${appMapDir}'.`
  );
  UI.success(
    `To generate OpenAPI from the AppMaps, run:

    npx @appland/appmap openapi --appmap-dir ${appMapDir} -o openapi.yml

To scan the AppMaps for potential code design issues, run:

    npx @appland/scanner scan --appmap-dir ${appMapDir} --all

To search the AppMaps for a class or package, run a command like:

    npx @appland/appmap inspect --appmap-dir ${appMapDir} -i package:com/example/app
    npx @appland/appmap inspect --appmap-dir ${appMapDir} -i package:app/models
    npx @appland/appmap inspect --appmap-dir ${appMapDir} -i class:app/models/User
  `,
    'left'
  );
}
