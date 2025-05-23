import UI from '../../userInteraction';
import configureHostAndPort from '../action/configureHostAndPort';
import RecordContext from '../recordContext';
import { State } from '../types/state';
import initial from './record_remote';

// No process could be contact on the configured host and port.
// Prompt the user to start the agent process, and then start over.
export default async function agentProcessNotRunning(context: RecordContext): Promise<State> {
  UI.progress(
    `It looks like you need to start your app (make sure you have the AppMap agent enabled).`
  );
  UI.progress(`Or maybe your app is running, but it's on a different host and/or port.`);
  UI.progress(``);

  UI.progress(
    `To create a recording, you need to run your app using ` +
      `the instructions in the AppMap documentation. Choose the most suitable link here, ` +
      `then configure and launch your app process. Once you've done that, come back to this terminal ` +
      `and we will try again.`
  );
  UI.progress(`
  Rails:      https://appland.com/docs/reference/appmap-ruby.html#remote-recording
  Django:     https://appland.com/docs/reference/appmap-python.html#django
  Flask:      https://appland.com/docs/reference/appmap-python.html#flask
  Java:       https://appland.com/docs/reference/appmap-java.html#remote-recording
  JavaScript: https://appmap.io/docs/reference/appmap-node.html#remote-recording
  `);

  await configureHostAndPort(context);

  return initial;
}
