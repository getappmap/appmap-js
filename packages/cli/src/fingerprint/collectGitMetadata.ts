import { exec } from 'child_process';
import sanitizeURL from '../lib/repositoryInfo';

type MetadataHandlerFn = (value: string) => string | string[] | undefined;

type MetadataSource = {
  command: string;
  handler?: MetadataHandlerFn;
};

const GitCommands: Record<string, string | MetadataSource> = {
  repository: `git config --get remote.origin.url`,
  user_name: `git config --get user.name`,
  user_email: `git config --get user.email`,
  branch: `git rev-parse --abbrev-ref HEAD`,
  commit: `git rev-parse HEAD`,
  status: {
    command: `git status -s`,
    handler: (value: string) => value.split('\n').map((line) => line.trim()),
  },
};

export default async function collectGitMetadata(properties: Record<string, string | string[]>) {
  const gitKeys = Object.keys(GitCommands);
  const commandErrors = new Map<string, Error>();
  await Promise.all(
    gitKeys.map(async (key) => {
      return new Promise<void>((resolve) => {
        const source = GitCommands[key];
        let command: string;
        let handler: MetadataHandlerFn | undefined;
        if (typeof source === 'string') {
          command = source as string;
        } else {
          command = (source as MetadataSource).command;
          handler = (source as MetadataSource).handler;
        }
        exec(command, (error, stdout, _stderr) => {
          if (error) {
            commandErrors.set(key, error);
            resolve();
          }
          let value: string | string[] | undefined = stdout.trim();
          if (handler) {
            value = handler(value);
          }
          if (value !== undefined) {
            properties[['git', key].join('.')] =
              typeof value === 'string' ? sanitizeURL(value) : value;
          }
          resolve();
        });
      });
    })
  );
}
