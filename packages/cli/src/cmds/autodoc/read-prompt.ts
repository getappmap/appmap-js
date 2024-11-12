import { existsSync, readFileSync } from 'fs';

export function readPrompt(prompt: string): string {
  if (!existsSync(prompt)) return prompt;

  return readFileSync(prompt, 'utf8');
}
