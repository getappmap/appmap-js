import UI from '../../userInteraction';
import configureRemainingRequestOptions from '../action/configureRemainingRequestOptions';
import detectProcessCharacteristics from '../action/detectProcessCharacteristics';
import continueWithRequestOptionConfiguration, {
  ConfigurationAction,
} from '../prompt/continueWithRequestOptionConfiguration';
import RecordContext from '../recordContext';
import isAgentAvailable from '../test/isAgentAvailable';
import { State } from '../types/state';
import agentProcessNotRunning from './agentProcessNotRunning';
import initial from './record_remote';

// The agent was not reachable using the configured settings. This may be because:
// * The agent process isn't running.
// * The agent process is running, but the agent isn't reachable (e.g. security filter?).
// * The host/port parameters are wrong.
// * The host/port parameters are right, but the agent URL is different than the default.
export default async function agentNotAvailable(
  recordContext: RecordContext
): Promise<State> {
  if (!(await detectProcessCharacteristics(recordContext))) {
    if (
      (await continueWithRequestOptionConfiguration(recordContext)) ===
      ConfigurationAction.HostAndPort
    )
      return agentProcessNotRunning;
  }

  UI.progress(
    `
You've confirmed that your application process is running, but I'm unable to connect to the AppMap agent over HTTP. There are three common reasons for this:

1) The agent isn't configured to accept connections in this process. For example, the app isn't running with APPMAP=true (Ruby, Python), or the app isn't running with the AppMap agent enabled (Java).
2) The agent is enabled, but HTTP requests to the agent are being blocked by some application or framework code; for example, a security filter.
3) The agent is enabled and reachable, but it's mounted to a non-root URL path (e.g. /myapp), or the application server is only requesting HTTPS connections.

For case (1), you'll need to re-launch the server with the agent enabled.

For case (2), you should contact AppMap support for help with troubleshooting.

For case (3), you can configure the application URL path and protocol.
`
  );

  await configureRemainingRequestOptions(recordContext);

  recordContext.populateURL();

  return initial;
}
