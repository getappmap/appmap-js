import { warn } from 'console';
import trimFences from './trim-fences';

export default function parseJSON<T>(
  text: string,
  warning: string | undefined = 'Non-JSON response from AI'
): T | undefined {
  const sanitizedTerms = trimFences(text);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(sanitizedTerms);
  } catch (err) {
    if (warning) {
      warn(warning);
      warn(err);
    }
    return undefined;
  }
}
