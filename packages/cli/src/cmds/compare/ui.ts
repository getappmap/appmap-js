import chalk from 'chalk';
import readline from 'readline';

export async function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise<string>((resolve) => {
    rl.question(q, resolve);
  });
}

export async function confirm(prompt: string, rl: readline.Interface): Promise<boolean> {
  let response = '';
  while (!['y', 'n'].includes(response)) {
    response = await ask(rl, `${prompt} (y/n) `);
  }
  return response === 'y';
}

export function actionStyle(message: string): string {
  return chalk.bold(chalk.green(message));
}

export function prominentStyle(message: string): string {
  return chalk.bold(message);
}
export function mutedStyle(message: string): string {
  return chalk.dim(message);
}

export function sanitizeRevision(revision: string): string {
  return revision.replace(/[^a-zA-Z0-9_]/g, '_');
}
