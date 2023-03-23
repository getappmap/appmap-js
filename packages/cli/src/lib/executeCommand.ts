import chalk from 'chalk';
import { exec } from 'child_process';
import { verbose } from '../utils';

function commandStyle(message: string): string {
  return chalk.gray(`$ ${message}`);
}

export function executeCommand(
  cmd: string,
  printCommand = true,
  printStdout = true,
  printStderr = true
): Promise<string> {
  if (printCommand || verbose()) console.log(commandStyle(cmd));
  const command = exec(cmd);
  const result: string[] = [];
  const stderr: string[] = [];
  if (command.stdout) {
    command.stdout.addListener('data', (data) => {
      if (printStdout || verbose()) process.stdout.write(data);
      result.push(data);
    });
  }
  if (command.stderr) {
    if (printStderr || verbose()) command.stderr.pipe(process.stdout);
    else command.stderr.addListener('data', (data) => stderr.push(data));
  }
  return new Promise<string>((resolve, reject) => {
    command.addListener('exit', (code) => {
      if (code === 0) {
        resolve(result.join(''));
      } else {
        if (!printCommand) console.log(commandStyle(cmd));
        console.warn(stderr.join(''));
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}
