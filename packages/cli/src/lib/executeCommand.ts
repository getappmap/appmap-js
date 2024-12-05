import chalk from 'chalk';
import { ExecOptions, exec, execFile } from 'node:child_process';
import { verbose } from '../utils';

function commandStyle(message: string): string {
  return chalk.gray(`$ ${message}`);
}

export function executeCommand(
  cmd: string,
  printCommand = verbose(),
  printStdout = verbose(),
  printStderr = verbose(),
  okCodes = [0],
  cwd?: string
): Promise<string> {
  if (printCommand) console.warn(commandStyle(cmd));
  const commandOptions: ExecOptions = {};
  if (cwd) commandOptions.cwd = cwd;
  const command = exec(cmd, commandOptions);
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
          console.warn(`Command "${cmd}" killed by signal ${signal}, exited with code ${code}`);
        }
        resolve(result.join(''));
      } else {
        if (!printCommand) console.warn(commandStyle(cmd));
        console.warn(stderr.join(''));
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

/**
 * This is a wrapper around `execFile` that returns a promise containing the stdout. `execFile` will
 * not spawn a shell, so it is less likely to be vulnerable to shell injection attacks.
 *
 * @param {string} command - The command to execute. This should be resolvable via `PATH`, and contain no arguments.
 * @param {string[]} args - The arguments to pass to the command.
 * @param {object} [options] - Options to pass to `execFile`.
 * @returns {Promise<string>} A promise containing the stdout of the command.
 */
export const execute = (command: string, args: string[], options?: { cwd?: string }) =>
  new Promise<string>((resolve, reject) => {
    const child = execFile(command, args, { ...(options ?? {}) });

    let stdout = '';
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (data: string) => {
      stdout += data.toString();
    });

    let stderr = '';
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (data: string) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr));
    });
  });
