import { warn } from 'console';
import trimFences from './trim-fences';

export default function parseJSON<T>(
  text: string,
  warnOnError: boolean,
  warning?: string | undefined
): T | undefined {
  const sanitizedTerms = trimFences(text);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(sanitizedTerms);
  } catch (err) {
    if (warnOnError) {
      warn(warning || 'Failed to parse JSON');
      warn(err);
    }
    return undefined;
  }
}
