import { ChildProcess, exec, execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import { verbose } from '../../utils';
import { Duplex } from 'stream';

export class ProcessLog {
  public static buffer: string = '';

  public static log(command: string, childProcess: ChildProcess) {
    this.buffer.concat(`\n\nRunning command: \`${command}\`\n\n`);
    childProcess.stdout?.on('data', (data: string) => {
      this.buffer.concat(data);
    });
    childProcess.stderr?.on('data', (data: string) => {
      this.buffer.concat(data);
    });
  }

  public static recordExit(
    program: string,
    code: number | null,
    signal: NodeJS.Signals | null
  ) {
    this.buffer.concat(
      `\n\n'${program}' exited with code ${code}, signal ${signal}\n\n`
    );
  }
}

export async function run(
  command: CommandStruct
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const cp = exec(command.toString(), {
      env: command.environment,
      cwd: command.path as string,
    });

    let stdout = '';
    let stderr = '';

    if (verbose()) {
      console.log(
        [
          `Running command: \`${chalk.yellow(command.toString())}\``,
          `cwd: ${chalk.yellow(path.resolve(command.path as string))}`,
          `environment: ${chalk.yellow(
            JSON.stringify(command.environment, undefined, 2)
          )}`,
        ].join('\n')
      );

      cp.stderr?.pipe(process.stderr);
      cp.stdout?.pipe(process.stdout);
    }

    cp.stderr?.on('data', (data) => {
      stderr += data;
    });

    cp.stdout?.on('data', (data) => {
      stdout += data;
    });

    ProcessLog.log(command.toString(), cp);

    cp.on('exit', (code, signal) => {
      if (verbose()) {
        console.log(`'${command.program}' exited with code ${code}`);
      }

      ProcessLog.recordExit(command.program, code, signal);

      if (code === 0) {
        return resolve({ stdout, stderr });
      }

      return reject(code);
    });
  });
}

export function runSync(command: CommandStruct) {
  return execSync(command.toString(), {
    env: command.environment,
    cwd: command.path as string,
  }).toString();
}
