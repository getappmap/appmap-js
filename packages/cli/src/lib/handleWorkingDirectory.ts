const { promises: fsp } = require('fs');

export function handleWorkingDirectory(directory?: string) {
  if (directory) process.chdir(directory);
}
