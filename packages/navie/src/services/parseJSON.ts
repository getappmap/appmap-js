import { warn } from 'console';

export function parseJSON(text: string): Record<string, unknown> | string | string[] | undefined {
  const sanitizedTerms = text.replace(/```json/g, '').replace(/```/g, '');
  try {
    return JSON.parse(sanitizedTerms);
  } catch (err) {
    warn(`Non-JSON response from AI.`);
    return undefined;
  }
}
