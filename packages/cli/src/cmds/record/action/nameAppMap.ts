import UI from '../../userInteraction';

export default async function nameAppMap(jsonData: any): Promise<string> {
  const { appMapName } = await UI.prompt({
    type: 'input',
    name: 'appMapName',
    message: 'Choose a name for your AppMap:',
    default: 'My recording',
  });

  jsonData['metadata'] = jsonData['metadata'] || {};
  jsonData['metadata']['name'] = appMapName;

  return appMapName;
}
