import Settings from './settings';

export default function (): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!Settings.valid) {
      reject(`AppMap client is not configured`);
      return;
    }
    if (!Settings.apiKey) {
      reject('No API key has been provided');
      return;
    }
    resolve();
  });
}
