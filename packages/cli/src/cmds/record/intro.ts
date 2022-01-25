import UI from '../userInteraction';
import ready from './ready';

export default async function () {
  UI.progress(`To create a recording, the first thing you need to do is run your app using
  the instructions in the AppMap documentation. Choose the most suitable link here,
  then configure and launch your app process. Press enter wen you're ready to continue.`);
  UI.progress(`
  Rails:      https://appland.com/docs/reference/appmap-ruby.html#remote-recording
  Django:     https://appland.com/docs/reference/appmap-python.html#django
  Flask:      https://appland.com/docs/reference/appmap-python.html#flask
  Java:       https://appland.com/docs/reference/appmap-java.html#remote-recording
  JavaScript: https://appland.com/docs/reference/appmap-agent-js.html#remote-recording
      `);

  return ready();
}
