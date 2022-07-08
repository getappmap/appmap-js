export function handleWorkingDirectory(directory?: string): void {
  if (directory) process.chdir(directory);
}
