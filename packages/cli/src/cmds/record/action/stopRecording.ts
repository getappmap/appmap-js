import UI from '../../userInteraction';

export default async function stopRecording() {
  await UI.continue('Press enter to stop recording');
}
