import { temporaryFile } from 'tempy';
import { AppMapBuilder } from '@appland/models';
import { Finding } from 'src/types';

export default function rule(finding: Finding): void {
  // Finding indicates the AppMap (test case), HTTP server request, template event,
  // and parameter.

  const appMap = new AppMapBuilder().source(finding.appMapFile).normalize().build();
  const [path, lineno] = appMap.metadata.source_location.split(':', 2);

  const method = finding.scope.httpServerRequest?.request_method;
  const route = finding.scope.httpServerRequest?.normalized_path_info;

  const requestIndex = appMap.events
    .filter(
      (e) =>
        e.httpServerRequest &&
        e.httpServerRequest.request_method === method &&
        e.httpServerRequest.normalized_path_info === route
    )
    .map((e) => e.id)
    .indexOf(finding.scope.id);

  // For many more fun options, see https://github.com/payloadbox/xss-payload-list
  const payload = `<script\x2F>javascript:alert(1)</script>`;
  const parameters = {} as { [key: string]: string };
  parameters[finding.properties.parameter.name] = payload;
  const attack = [
    {
      path,
      lineno,
      route: [method?.toUpperCase(), route].join(' '),
      invocation_number: requestIndex,
      parameters,
    },
  ];
  const attackJSON = JSON.stringify(attack);

  // Re-run the test.
  // Re-run the scan.
  // See if the finding includes the payload.
  const tempFilePath = temporaryFile({ name: 'attack.json' });
  fs.write(tempFilePath, attackJSON);
}
