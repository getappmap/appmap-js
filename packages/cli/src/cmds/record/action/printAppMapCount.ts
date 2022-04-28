import UI from '../../userInteraction';
import countAppMaps from './countAppMaps';

export default async function printAppMapCount(appMapDir: string) {
  const appMapCount = await countAppMaps(appMapDir);

  UI.success(
    `There are now ${appMapCount} AppMap files in directory '${appMapDir}'.`
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
