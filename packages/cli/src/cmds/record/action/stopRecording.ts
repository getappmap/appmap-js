import UI from '../../userInteraction';

export default async function stopRecording() {
  await UI.confirm('Press enter to stop recording');
}
