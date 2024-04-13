import { basename, join } from 'path';
import { executeCommand } from '../lib/executeCommand';
import { verbose, isFile } from '../utils';
import { isBinaryFile } from './listProjectFiles';

// Run git ls-files and git status to get a list of all git-managed files. By doing it this way,
// we automatically apply any .gitignore rules.
export default async function listGitProjectFiles(directory: string): Promise<string[]> {
  const lsFiles = async (): Promise<string[]> => {
    const gitFiles = (
      await executeCommand('git ls-files', verbose(), verbose(), verbose(), [0], directory)
    ).split('\n');
    return gitFiles.filter(Boolean);
  };
  const statusFiles = async (): Promise<string[]> => {
    return (
      await executeCommand(
        'git status --porcelain',
        verbose(),
        verbose(),
        verbose(),
        [0],
        directory
      )
    )
      .split('\n')
      .map((line) => {
        const [, fileName] = line.split(' ');
        return fileName;
      });
  };

  const result = new Set<string>();
  // TODO: Boost new and modified files.
  for (const file of [...(await lsFiles()), ...(await statusFiles())]) {
    if (!file) {
      continue;
    }
    const filePath = join(directory, file);
    if ((await isFile(filePath)) && !isBinaryFile(basename(filePath))) {
      result.add(file);
    }
  }

  return [...result].sort();
}
