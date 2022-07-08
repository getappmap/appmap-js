export function handleWorkingDirectory(directory?: string) {
  if (directory) process.chdir(directory);
}
