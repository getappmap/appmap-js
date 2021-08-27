import { exec, execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import CommandStruct from './commandStruct';

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

    cp.stderr?.on('data', (data) => {
      stderr += data;
    });

    cp.stdout?.on('data', (data) => {
      stdout += data;
    });

    cp.on('exit', (code) => {
      console.log(`'${command.program}' exited with code ${code}`);
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
