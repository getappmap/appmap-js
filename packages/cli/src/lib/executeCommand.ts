import chalk from 'chalk';
import { exec } from 'child_process';
import { verbose } from '../utils';

function commandStyle(message: string): string {
  return chalk.gray(`$ ${message}`);
}

export function executeCommand(
  cmd: string,
  printCommand = verbose(),
  printStdout = verbose(),
  printStderr = verbose(),
  okCodes = [0]
): Promise<string> {
  if (printCommand) console.log(commandStyle(cmd));
  const command = exec(cmd);
  const result: string[] = [];
  const stderr: string[] = [];
  if (command.stdout) {
    command.stdout.addListener('data', (data) => {
      if (printStdout) process.stdout.write(data);
      result.push(data);
    });
  }
  if (command.stderr) {
    if (printStderr) command.stderr.pipe(process.stdout);
    else command.stderr.addListener('data', (data) => stderr.push(data));
  }
  return new Promise<string>((resolve, reject) => {
    command.addListener('exit', (code, signal) => {
      if (signal || (code !== null && okCodes.includes(code))) {
        if (signal) {
          console.log(`Command "${cmd}" killed by signal ${signal}, exited with code ${code}`);
        }
        resolve(result.join(''));
      } else {
        if (!printCommand) console.log(commandStyle(cmd));
        console.warn(stderr.join(''));
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}
