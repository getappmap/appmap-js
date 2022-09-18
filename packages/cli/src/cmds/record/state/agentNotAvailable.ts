import openTicket, { DEFAULT_HELP_MSG } from '../../../lib/ticket/openTicket';
import UI from '../../userInteraction';
import configureRemainingRequestOptions from '../action/configureRemainingRequestOptions';
import detectProcessCharacteristics from '../action/detectProcessCharacteristics';
import continueWithRequestOptionConfiguration, {
  ConfigurationAction,
} from '../prompt/continueWithRequestOptionConfiguration';
import RecordContext from '../recordContext';
import { State } from '../types/state';
import abort from './abort';
import agentProcessNotRunning from './agentProcessNotRunning';
import initial from './record_remote';

export const NextStepChoices = {
  CONFIGURE: { name: 'Configure the path and protocol', value: 'configure' },
  RELAUNCH: { name: 'Re-launch the server', value: 'relaunch' },
  SUPPORT: { name: 'Contact support', value: 'support' },
};

// The agent was not reachable using the configured settings. This may be because:
// * The agent process isn't running.
// * The agent process is running, but the agent isn't reachable (e.g. security filter?).
// * The host/port parameters are wrong.
// * The host/port parameters are right, but the agent URL is different than the default.
export default async function agentNotAvailable(recordContext: RecordContext): Promise<State> {
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

1) The agent is enabled and reachable, but it's mounted to a non-root URL path (e.g. /myapp), or the application server is only requesting HTTPS connections.
2) The agent isn't configured to accept connections in this process. For example, the app isn't running with APPMAP=true (Ruby, Python), or the app isn't running with the AppMap agent enabled (Java).
3) The agent is enabled, but HTTP requests to the agent are being blocked by some application or framework code; for example, a security filter.

For case (1), you can configure the application URL path and protocol.

For case (2), you'll need to re-launch the server with the agent enabled.

For case (3), you should contact AppMap support for help with troubleshooting.
`
  );

  const { option } = await UI.prompt({
    type: 'list',
    name: 'option',
    message: 'Which would you like to do?',
    choices: Object.values(NextStepChoices),
  });

  switch (option) {
    case NextStepChoices.CONFIGURE.value:
      await configureRemainingRequestOptions(recordContext);
      recordContext.populateURL();
      break;
    case NextStepChoices.RELAUNCH.value:
      await UI.continue('Press enter when the server has been restarted');
      break;
    case NextStepChoices.SUPPORT.value:
      const details = recordContext.remoteError?.toString() || '';

      await openTicket(details, DEFAULT_HELP_MSG, false);

      return abort; // We're done
      break;
  }

  return initial;
}
