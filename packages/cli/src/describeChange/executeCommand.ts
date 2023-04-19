import { exec } from 'child_process';
import { commandStyle } from '../cmds/describeChange';

export function executeCommand(
  cmd: string,
  printCommand = true,
  printStdout = true,
  printStderr = true
): Promise<string> {
  if (printCommand) console.log(commandStyle(cmd));
  const command = exec(cmd);
  const result: string[] = [];
  if (command.stdout) {
    command.stdout.addListener('data', (data) => {
      if (printStdout) process.stdout.write(data);
      result.push(data);
    });
  }
  if (printStderr && command.stderr) command.stderr.pipe(process.stdout);
  return new Promise<string>((resolve, reject) => {
    command.addListener('exit', (code) => {
      if (code === 0) {
        resolve(result.join(''));
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}
