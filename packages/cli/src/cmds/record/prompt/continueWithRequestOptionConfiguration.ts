import UI from '../../userInteraction';
import RecordContext from '../recordContext';
export enum ConfigurationAction {
  HostAndPort = 'Reconfigure host and port',
  RequestOptions = 'Keep the host and port, and configure additional connection options',
}

export default async function continueWithRequestOptionConfiguration({
  configuration,
}: RecordContext): Promise<ConfigurationAction> {
  UI.progress(
    `I can't find your AppMap server process on port ${configuration.requestOptions().port}.`
  );
  UI.progress('');
  UI.progress(
    `If you're sure it's running on that port, we can continue with extra configuration ` +
      `options that may enable me to connect to the agent. ` +
      `Otherwise you can start over by reconfiguring the host and port.`
  );
  UI.progress('');

  const { configurationAction } = await UI.prompt({
    type: 'list',
    choices: [ConfigurationAction.HostAndPort, ConfigurationAction.RequestOptions],
    name: 'configurationAction',
    message: 'What would you like to do?',
  });
  return configurationAction;
}
