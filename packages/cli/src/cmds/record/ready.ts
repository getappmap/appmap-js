import UI from '../userInteraction';

export default async function ready() {
  const { ready } = await UI.prompt({
    type: 'confirm',
    name: 'ready',
    message: 'Ready?',
    default: 'y',
  });
  if (!ready) {
    return ready();
  }
}
